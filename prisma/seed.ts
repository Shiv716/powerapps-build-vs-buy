import { KycDocumentType, KycStatus, Prisma, PrismaClient } from "@prisma/client";
import { riskBandFor } from "../src/lib/resources/kyc-risk";

const prisma = new PrismaClient();

const users = [
  { email: "vera.viewer@example.com", name: "Vera Viewer", roles: ["viewer"] },
  { email: "riley.reviewer@example.com", name: "Riley Reviewer", roles: ["viewer", "reviewer"] },
  { email: "avery.approver@example.com", name: "Avery Approver", roles: ["viewer", "approver"] },
  { email: "adrian.admin@example.com", name: "Adrian Admin", roles: ["viewer", "reviewer", "approver", "admin"] },
];

type SeedEvent =
  | { kind: "claim"; actor: string; daysAfter: number }
  | { kind: "escalate"; actor: string; daysAfter: number; reason: string }
  | { kind: "approve"; actor: string; daysAfter: number; reason: string }
  | { kind: "reject"; actor: string; daysAfter: number; reason: string; category: string };

type SeedCase = {
  id: string;
  applicantName: string;
  applicantEmail: string;
  country: string;
  dateOfBirth: string;
  riskScore: number;
  submittedDaysAgo: number;
  documents: KycDocumentType[];
  events: SeedEvent[];
};

const DOCUMENT_FILES: Record<KycDocumentType, string> = {
  passport: "/thumbnails/passport.svg",
  driving_licence: "/thumbnails/driving-licence.svg",
  proof_of_address: "/thumbnails/proof-of-address.svg",
};

const kycCases: SeedCase[] = [
  {
    id: "kyc_seed_001",
    applicantName: "Amara Okafor",
    applicantEmail: "amara.okafor@example.net",
    country: "NG",
    dateOfBirth: "1991-03-14",
    riskScore: 88,
    submittedDaysAgo: 9,
    documents: ["passport", "proof_of_address"],
    events: [],
  },
  {
    id: "kyc_seed_002",
    applicantName: "Boris Ivanov",
    applicantEmail: "boris.ivanov@example.net",
    country: "CY",
    dateOfBirth: "1976-11-02",
    riskScore: 93,
    submittedDaysAgo: 6,
    documents: ["passport"],
    events: [
      { kind: "claim", actor: "riley.reviewer@example.com", daysAfter: 1 },
      {
        kind: "escalate",
        actor: "riley.reviewer@example.com",
        daysAfter: 2,
        reason: "Source of funds unclear; corporate structure spans three jurisdictions.",
      },
    ],
  },
  {
    id: "kyc_seed_003",
    applicantName: "Chen Wei",
    applicantEmail: "chen.wei@example.net",
    country: "SG",
    dateOfBirth: "1988-07-21",
    riskScore: 34,
    submittedDaysAgo: 12,
    documents: ["passport", "driving_licence", "proof_of_address"],
    events: [
      { kind: "claim", actor: "riley.reviewer@example.com", daysAfter: 1 },
      {
        kind: "approve",
        actor: "avery.approver@example.com",
        daysAfter: 3,
        reason: "Documents consistent, low risk score, address verified against statement.",
      },
    ],
  },
  {
    id: "kyc_seed_004",
    applicantName: "Diego Fernández",
    applicantEmail: "diego.fernandez@example.net",
    country: "MX",
    dateOfBirth: "1995-01-30",
    riskScore: 71,
    submittedDaysAgo: 8,
    documents: ["driving_licence", "proof_of_address"],
    events: [
      { kind: "claim", actor: "riley.reviewer@example.com", daysAfter: 2 },
      {
        kind: "reject",
        actor: "avery.approver@example.com",
        daysAfter: 4,
        reason: "Licence photo does not match selfie provided at onboarding.",
        category: "identity_mismatch",
      },
    ],
  },
  {
    id: "kyc_seed_005",
    applicantName: "Elena Petrova",
    applicantEmail: "elena.petrova@example.net",
    country: "BG",
    dateOfBirth: "1983-09-05",
    riskScore: 55,
    submittedDaysAgo: 4,
    documents: ["passport", "proof_of_address"],
    events: [{ kind: "claim", actor: "riley.reviewer@example.com", daysAfter: 1 }],
  },
  {
    id: "kyc_seed_006",
    applicantName: "Farid Rahimi",
    applicantEmail: "farid.rahimi@example.net",
    country: "TR",
    dateOfBirth: "1979-05-18",
    riskScore: 77,
    submittedDaysAgo: 5,
    documents: ["passport"],
    events: [{ kind: "claim", actor: "avery.approver@example.com", daysAfter: 1 }],
  },
  {
    id: "kyc_seed_007",
    applicantName: "Grace Mensah",
    applicantEmail: "grace.mensah@example.net",
    country: "GH",
    dateOfBirth: "1999-12-11",
    riskScore: 22,
    submittedDaysAgo: 15,
    documents: ["driving_licence", "proof_of_address"],
    events: [],
  },
  {
    id: "kyc_seed_008",
    applicantName: "Henrik Larsen",
    applicantEmail: "henrik.larsen@example.net",
    country: "DK",
    dateOfBirth: "1972-04-27",
    riskScore: 12,
    submittedDaysAgo: 20,
    documents: ["passport", "driving_licence"],
    events: [
      { kind: "claim", actor: "adrian.admin@example.com", daysAfter: 1 },
      {
        kind: "approve",
        actor: "avery.approver@example.com",
        daysAfter: 2,
        reason: "Long-standing customer re-verification; all documents current.",
      },
    ],
  },
  {
    id: "kyc_seed_009",
    applicantName: "Isabella Rossi",
    applicantEmail: "isabella.rossi@example.net",
    country: "IT",
    dateOfBirth: "1990-08-08",
    riskScore: 47,
    submittedDaysAgo: 3,
    documents: ["passport", "proof_of_address"],
    events: [],
  },
  {
    id: "kyc_seed_010",
    applicantName: "Jamal Hassan",
    applicantEmail: "jamal.hassan@example.net",
    country: "AE",
    dateOfBirth: "1986-02-19",
    riskScore: 81,
    submittedDaysAgo: 2,
    documents: ["passport", "proof_of_address"],
    events: [
      {
        kind: "escalate",
        actor: "riley.reviewer@example.com",
        daysAfter: 1,
        reason: "Possible name match on adverse media; needs approver review.",
      },
    ],
  },
  {
    id: "kyc_seed_011",
    applicantName: "Katarzyna Nowak",
    applicantEmail: "katarzyna.nowak@example.net",
    country: "PL",
    dateOfBirth: "1993-06-23",
    riskScore: 39,
    submittedDaysAgo: 7,
    documents: ["driving_licence"],
    events: [],
  },
  {
    id: "kyc_seed_012",
    applicantName: "Liam O'Sullivan",
    applicantEmail: "liam.osullivan@example.net",
    country: "IE",
    dateOfBirth: "1984-10-01",
    riskScore: 64,
    submittedDaysAgo: 10,
    documents: ["passport", "driving_licence", "proof_of_address"],
    events: [
      { kind: "claim", actor: "riley.reviewer@example.com", daysAfter: 1 },
      {
        kind: "reject",
        actor: "adrian.admin@example.com",
        daysAfter: 5,
        reason: "Proof of address is older than 90 days and utility account is closed.",
        category: "document_invalid",
      },
    ],
  },
  {
    id: "kyc_seed_013",
    applicantName: "Mei Tanaka",
    applicantEmail: "mei.tanaka@example.net",
    country: "JP",
    dateOfBirth: "1997-03-03",
    riskScore: 18,
    submittedDaysAgo: 1,
    documents: ["passport"],
    events: [],
  },
  {
    id: "kyc_seed_014",
    applicantName: "Nikolai Sokolov",
    applicantEmail: "nikolai.sokolov@example.net",
    country: "KZ",
    dateOfBirth: "1969-01-16",
    riskScore: 96,
    submittedDaysAgo: 11,
    documents: ["passport", "proof_of_address"],
    events: [],
  },
];

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

type CaseState = {
  id: string;
  applicantName: string;
  applicantEmail: string;
  country: string;
  dateOfBirth: string;
  riskScore: number;
  riskBand: string;
  status: KycStatus;
  rejectionCategory: string | null;
  assigneeId: string | null;
  submittedAt: string;
  decidedAt: string | null;
  decidedById: string | null;
};

async function seedKycCases(userIds: Map<string, string>) {
  for (const seed of kycCases) {
    const existing = await prisma.kycCase.findUnique({ where: { id: seed.id } });
    if (existing) continue;

    const submittedAt = daysAgo(seed.submittedDaysAgo);
    let state: CaseState = {
      id: seed.id,
      applicantName: seed.applicantName,
      applicantEmail: seed.applicantEmail,
      country: seed.country,
      dateOfBirth: new Date(seed.dateOfBirth).toISOString(),
      riskScore: seed.riskScore,
      riskBand: riskBandFor(seed.riskScore),
      status: "pending",
      rejectionCategory: null,
      assigneeId: null,
      submittedAt: submittedAt.toISOString(),
      decidedAt: null,
      decidedById: null,
    };

    const auditRows: Prisma.AuditLogCreateManyInput[] = [];
    for (const event of seed.events) {
      const actorId = userIds.get(event.actor);
      if (!actorId) throw new Error(`Unknown seed actor: ${event.actor}`);
      const at = new Date(submittedAt.getTime() + event.daysAfter * 24 * 60 * 60 * 1000);
      const before = { ...state };
      if (event.kind === "claim") {
        state = { ...state, status: "in_review", assigneeId: actorId };
      } else if (event.kind === "escalate") {
        state = { ...state, status: "escalated" };
      } else {
        state = {
          ...state,
          status: event.kind === "approve" ? "approved" : "rejected",
          rejectionCategory: event.kind === "reject" ? event.category : null,
          decidedAt: at.toISOString(),
          decidedById: actorId,
        };
      }
      const reason = event.kind === "claim" ? null : event.reason;
      auditRows.push({
        actorId,
        actorEmail: event.actor,
        action: `kyc-cases.${event.kind}`,
        entityType: "kycCase",
        entityId: seed.id,
        before,
        after: { ...state },
        reason,
        createdAt: at,
      });
    }

    await prisma.kycCase.create({
      data: {
        id: seed.id,
        applicantName: seed.applicantName,
        applicantEmail: seed.applicantEmail,
        country: seed.country,
        dateOfBirth: new Date(seed.dateOfBirth),
        riskScore: seed.riskScore,
        riskBand: riskBandFor(seed.riskScore),
        status: state.status,
        rejectionCategory: state.rejectionCategory,
        assigneeId: state.assigneeId,
        submittedAt,
        decidedAt: state.decidedAt ? new Date(state.decidedAt) : null,
        decidedById: state.decidedById,
        documents: {
          create: seed.documents.map((type, index) => ({
            id: `${seed.id}_doc_${index + 1}`,
            type,
            fileUrl: DOCUMENT_FILES[type],
            uploadedAt: submittedAt,
          })),
        },
      },
    });
    if (auditRows.length > 0) {
      await prisma.auditLog.createMany({ data: auditRows });
    }
    console.log(`Seeded KYC case ${seed.id} (${state.status})`);
  }
}

async function main() {
  const userIds = new Map<string, string>();
  for (const user of users) {
    const record = await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, roles: user.roles },
      create: user,
    });
    userIds.set(record.email, record.id);
    console.log(`Seeded user ${record.email} [${record.roles.join(", ")}]`);
  }

  await seedKycCases(userIds);

  const userCount = await prisma.user.count();
  const caseCount = await prisma.kycCase.count();
  console.log(`Seed complete: ${userCount} users, ${caseCount} KYC cases.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
