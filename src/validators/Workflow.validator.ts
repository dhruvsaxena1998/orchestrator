import { z } from "zod";
import { err, ok } from "neverthrow";

const ApiRequestSchema = z.object({
  query: z.record(z.string()).optional(),
  params: z.record(z.string()).optional(),
  headers: z.record(z.string()).optional(),
  body: z.record(z.string()).optional(),
});

const MethodSchema = z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]);

const ApiSchema = z.object({
  slug: z.string(),
  endpoint: z.string(),
  method: MethodSchema,
  request: ApiRequestSchema,
});

const NextStepSchema = z.union([
  z.object({ next: z.literal("complete") }),
  z.object({ next: z.literal("error") }),
  z.object({ next: z.literal("step"), slug: z.string() }),
]);

const StepSchema = z.object({
  slug: z.string(),
  api: z.string(),
  validate: z
    .object({
      response: z.record(z.unknown()),
    })
    .optional(),
  on_success: NextStepSchema,
  on_failure: NextStepSchema,
});

const MetadataSchema = z
  .object({
    tags: z.array(z.string()).optional(),
    author: z
      .object({
        name: z.string(),
        email: z.string().email().optional(),
      })
      .optional(),
    documentation: z
      .object({
        href: z.string().url(),
      })
      .optional(),
  })
  .optional();

const WorkflowSchema = z.object({
  slug: z.string(),
  description: z.string().optional(),
  version: z.string().regex(/^v\d+$/),
  metadata: MetadataSchema,
  steps: z.array(StepSchema).min(1),
});

export type API = z.infer<typeof ApiSchema>;
export type Workflow = z.infer<typeof WorkflowSchema>;
export type Step = z.infer<typeof StepSchema>;

export const validateWorkflow = (workflows: unknown) => {
  const validation = z.array(WorkflowSchema).safeParse(workflows);

  if (!validation.success) {
    return err(validation.error.issues);
  }

  return ok(validation.data);
};

export const validateAPI = (api: unknown) => {
  const validation = z.array(ApiSchema).safeParse(api);

  if (!validation.success) {
    return err(validation.error.issues);
  }

  return ok(validation.data);
};
