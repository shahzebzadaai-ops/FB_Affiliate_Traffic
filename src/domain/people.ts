import type { Role } from "@/domain/types";

export type StaffMember = {
  id: string;
  name: string;
  role: Role;
  markets: string[];
  pageCodes: string[];
  active: boolean;
};

export const STAFF: StaffMember[] = [
  {
    id: "shahzeb",
    name: "Shahzeb",
    role: "SUPER_ADMIN",
    markets: ["UK"],
    pageCodes: ["BGUK", "AHSUK", "SPSUK", "SGIUK", "CBCUK"],
    active: true,
  },
  {
    id: "masho",
    name: "Masho",
    role: "CONTENT_OPERATOR",
    markets: ["UK"],
    pageCodes: ["BGUK", "AHSUK", "SPSUK", "SGIUK", "CBCUK"],
    active: true,
  },
];

export function staffById(id: string, staff: StaffMember[] = STAFF): StaffMember | undefined {
  return staff.find((person) => person.id === id);
}

export function activeOperators(marketCode: string, staff: StaffMember[] = STAFF): StaffMember[] {
  return staff.filter(
    (person) =>
      person.active &&
      person.role === "CONTENT_OPERATOR" &&
      person.markets.includes(marketCode),
  );
}

export function marketReviewer(marketCode: string, staff: StaffMember[] = STAFF): StaffMember | undefined {
  return staff.find(
    (person) =>
      person.active &&
      person.role === "SUPER_ADMIN" &&
      person.markets.includes(marketCode),
  );
}
