import {
  type Workflow,
  validateWorkflow,
} from "../validators/Workflow.validator";

const workflows: Workflow[] = [
  {
    slug: "get_info",
    version: "v1",
    steps: [
      {
        slug: "get_user",
        api: "get_user",
        on_success: {
          next: "step",
          slug: "get_photos_by_album",
        },
        on_failure: {
          next: "error",
        },
      },
      {
        slug: "get_posts_by_user",
        api: "get_posts_by_user",
        on_success: {
          next: "complete",
        },
        on_failure: {
          next: "error",
        },
      },
      {
        slug: "get_photos_by_album",
        api: "get_photos_by_album",
        on_success: {
          next: "step",
          slug: "get_posts_by_user",
        },
        on_failure: {
          next: "error",
        },
      },
    ],
  },
];

export default () => {
  const validate = validateWorkflow(workflows);
  if (validate.isErr()) {
    console.log(validate.error);
    throw new Error("Invalid workflow");
  }

  return validate.value;
};
