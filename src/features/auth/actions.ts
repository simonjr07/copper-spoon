"use server";

import { AuthError } from "next-auth";

import { signIn, signOut } from "@/auth";
import { loginCredentialsSchema } from "@/features/auth/schemas";

export type LoginActionState = {
  message?: string;
  fieldErrors?: {
    email?: string[];
    password?: string[];
  };
};

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = loginCredentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;

    return {
      message: "Check the highlighted fields and try again.",
      fieldErrors: {
        email: fieldErrors.email,
        password: fieldErrors.password,
      },
    };
  }

  try {
    await signIn("credentials", {
      ...parsed.data,
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError && error.type === "CredentialsSignin") {
      return {
        message: "Email or password is incorrect, or the account is unavailable.",
      };
    }

    throw error;
  }

  return {};
}

export async function logoutAction() {
  await signOut({ redirectTo: "/admin/login" });
}
