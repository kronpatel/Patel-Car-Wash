import {
  apiSuccess,
  apiCreated,
  apiError,
  requireAdmin,
  validateStaffInput,
} from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import {
  getAllStaffWithStats,
  findStaffByMobile,
  findStaffByEmail,
  getNextStaffId,
  hashPassword,
} from "@/lib/staff-helpers";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/employees
 * Query params: role, status, search
 * Admin-only
 */
export async function GET(req: Request) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return apiError("Unauthorized. Admin access required.", 401);
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    const staff = await getAllStaffWithStats({
      role,
      status,
      search,
    });

    // Remove password field from results
    const sanitizedStaff = staff.map(({ password: _, ...rest }) => rest);

    return apiSuccess(sanitizedStaff);
  } catch (error) {
    console.error("GET /api/admin/employees error:", error);
    return apiError("Failed to fetch employee list", 500);
  }
}

/**
 * POST /api/admin/employees
 * Creates new staff member
 * Admin-only
 */
export async function POST(req: Request) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return apiError("Unauthorized. Admin access required.", 401);
    }

    const body = (await req.json()) as Record<string, unknown>;

    // 1. Validate input
    const validation = validateStaffInput(body, false);
    if (!validation.valid || !validation.data) {
      return apiError(validation.error || "Invalid input data", 400);
    }

    const { name, email, mobile, address, joiningDate, role, photo, baseSalary } = validation.data;

    // 2. Check duplicate email & mobile
    const existingEmail = await prisma.staff.findUnique({
      where: { email: email! },
    });
    if (existingEmail) {
      return apiError("Email already registered", 400);
    }

    const existingMobile = await findStaffByMobile(mobile!);
    if (existingMobile) {
      return apiError("Mobile number already registered.", 400);
    }

    // 3. Generate Staff ID (EMP001, EMP002...)
    const staffId = await getNextStaffId();

    // 4. Default password = mobile number
    const hashedPassword = await hashPassword(mobile!);

    // 5. Create staff record in MySQL
    const newStaff = await prisma.staff.create({
      data: {
        staffId,
        name: name!,
        email: email!,
        mobile: mobile!,
        password: hashedPassword,
        address: address || null,
        joiningDate: joiningDate!,
        role: role!,
        photo: photo || null,
        baseSalary: baseSalary || 0,
        status: "ACTIVE",
      },
    });

    // 6. Return response without password
    const { password: _, ...sanitizedStaff } = newStaff;

    return apiCreated(sanitizedStaff, "Staff created successfully");
  } catch (error) {
    console.error("POST /api/admin/employees error:", error);
    return apiError("Failed to create staff record", 500);
  }
}
