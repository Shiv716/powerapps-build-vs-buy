import { kycCases } from "@/lib/resources/kyc-cases";
import { refunds } from "@/lib/resources/refunds";
import type { ResourceConfig } from "@/lib/resources/types";

/**
 * Every internal tool registers its resource declaration here. Adding a new
 * tool means adding one resource file (imported below) and one Prisma model.
 */
const resourceList: ResourceConfig[] = [kycCases, refunds];

export const resources: ReadonlyMap<string, ResourceConfig> = new Map(
  resourceList.map((resource) => [resource.slug, resource]),
);

export function getResource(slug: string): ResourceConfig | undefined {
  return resources.get(slug);
}
