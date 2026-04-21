export type SignInTenantMembershipRepository = {
  findTenantMembership(userId: string): Promise<{ tenantId?: string } | null>;
};

export async function resolvePostSignInPath(
  userId: string,
  repository: SignInTenantMembershipRepository
): Promise<"/dashboard" | "/setup"> {
  const tenantMember = await repository.findTenantMembership(userId);
  return tenantMember?.tenantId ? "/dashboard" : "/setup";
}

export function resolvePostSignUpFlow(hasSession: boolean) {
  if (!hasSession) {
    return {
      redirectPath: "/login" as const,
      message: "註冊成功，請先至信箱完成驗證後登入"
    };
  }

  return {
    redirectPath: "/setup" as const,
    message: null
  };
}
