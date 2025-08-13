import type { Profile } from "@/context/AuthContext";

export function isPremium(profile: Profile | null | undefined) {
  return profile?.role === "analista_premium";
}

export function canIngressar(profile: Profile | null | undefined) {
  return isPremium(profile);
}

export function canChangeStatus(profile: Profile | null | undefined) {
  return isPremium(profile);
}

export function canEditReanalysis(profile: Profile | null | undefined) {
  return profile?.role === "analista_premium" || profile?.role === "reanalista";
}

export function sameCompany(profile: Profile | null | undefined, targetCompanyId?: string | null) {
  if (!profile?.company_id || !targetCompanyId) return false;
  return profile.company_id === targetCompanyId;
}

export function isSenior(profile: Profile | null | undefined) {
  return isPremium(profile); // Alias para is_premium, sem novo papel
}
