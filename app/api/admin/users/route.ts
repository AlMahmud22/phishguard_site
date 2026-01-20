import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth";
import connectToDatabase from "@/lib/db";
import User from "@/lib/models/User";
import { checkRateLimit } from "@/lib/rateLimit";
import type { AdminUser, AdminUsersResponse } from "@/types";

/// GET /api/admin/users - Fetch all users with pagination and filtering
/// Requires admin or tester role
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    /// check authentication
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    /// check role permission (admin or tester)
    if (!hasAnyRole(session, ["admin", "tester"])) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Requires admin or tester role" },
        { status: 403 }
      );
    }

    /// rate limit check - 100 requests per hour per user
    const rateLimit = await checkRateLimit(session.user.id, {
      endpoint: "/api/admin/users",
      limit: 100,
      windowMs: 3600000, // 1 hour
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded. Try again later.",
          resetAt: rateLimit.resetAt.toISOString(),
        },
        { status: 429 }
      );
    }

    await connectToDatabase();

    /// parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const role = searchParams.get("role");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    /// build filter query
    const filter: any = {};

    if (role && ["user", "tester", "admin"].includes(role)) {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    /// calculate pagination
    const skip = (page - 1) * limit;

    /// build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    /// fetch users with pagination
    const users = await User.find(filter)
      .select("-passwordHash")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    /// get total count for pagination
    const total = await User.countDocuments(filter);

    /// transform users to AdminUser format
    const adminUsers: AdminUser[] = users.map((user: any) => ({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      provider: user.provider,
      accountStatus: user.accountStatus || "approved",
      isActive: true, // could add isActive field to schema later
      totalScans: 0, // TODO: calculate from scans collection
      lastLogin: undefined, // TODO: add lastLogin tracking
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));

    const response: AdminUsersResponse = {
      users: adminUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return NextResponse.json(
      { success: true, data: response },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch users",
      },
      { status: 500 }
    );
  }
}

/// PATCH /api/admin/users - Update user role or status
/// Requires admin role only
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();

    /// check authentication
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    /// check role permission (admin only for modifications)
    if (!hasAnyRole(session, ["admin"])) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Requires admin role" },
        { status: 403 }
      );
    }

    /// rate limit check - 50 updates per hour per admin
    const rateLimit = await checkRateLimit(session.user.id, {
      endpoint: "/api/admin/users:update",
      limit: 50,
      windowMs: 3600000, // 1 hour
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded. Try again later.",
          resetAt: rateLimit.resetAt.toISOString(),
        },
        { status: 429 }
      );
    }

    await connectToDatabase();

    const body = await request.json();
    const { userId, role, accountStatus, isActive } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    /// build update object
    const update: any = {};
    
    if (role && ["user", "tester", "admin"].includes(role)) {
      update.role = role;
    }

    if (accountStatus && ["pending", "approved", "rejected"].includes(accountStatus)) {
      update.accountStatus = accountStatus;
    }

    if (typeof isActive === "boolean") {
      // TODO: implement isActive field in schema
      update.updatedAt = new Date();
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid updates provided" },
        { status: 400 }
      );
    }

    /// update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true, runValidators: true }
    ).select("-passwordHash");

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "User updated successfully",
        data: {
          id: (updatedUser._id as any).toString(),
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update user",
      },
      { status: 500 }
    );
  }
}
