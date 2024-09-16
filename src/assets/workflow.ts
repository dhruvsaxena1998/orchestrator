import {
  type Workflow,
  validateWorkflow,
} from "../validators/Workflow.validator";

const workflows: Workflow[] = [
  // {
  //   slug: "register",
  //   description: "Register a new user in the system",
  //   version: "v1",
  //   metadata: {
  //     tags: [],
  //     author: {
  //       name: "dhruvsaxena",
  //       email: "dhruvsaxena119@gmail.com",
  //     },
  //     documentation: {
  //       href: "https://confluence.example.com/display/WORKFLOWS/User+Registration",
  //     },
  //   },
  //   steps: [
  //     {
  //       slug: "check_username",
  //       api: "check_username",
  //       validate: {
  //         response: {
  //           status: 200,
  //           "data.available": false,
  //         },
  //       },
  //       on_success: {
  //         next: "step",
  //         slug: "create_user",
  //       },
  //       on_failure: {
  //         next: "error",
  //       },
  //     },
  //     {
  //       slug: "create_user",
  //       api: "create_user",
  //       validate: {
  //         response: {
  //           status: 201,
  //         },
  //       },
  //       on_success: {
  //         next: "step",
  //         slug: "send_welcome_email",
  //       },
  //       on_failure: {
  //         next: "error",
  //       },
  //     },
  //     {
  //       slug: "send_welcome_email",
  //       api: "send_welcome_email",
  //       validate: {
  //         response: {
  //           status: 200,
  //         },
  //       },
  //       on_success: {
  //         next: "complete",
  //       },
  //       on_failure: {
  //         next: "error",
  //       },
  //     },
  //   ],
  // },
  {
    slug: "get_info",
    version: "v1",
    steps: [
      {
        slug: "get_user",
        api: "get_user",
        on_success: {
          next: "step",
          slug: "get_posts_by_user",
        },
        on_failure: {
          next: "error",
        },
      },
      {
        slug: "get_posts_by_user",
        api: "get_posts_by_user",
        on_success: {
          next: "step",
          slug: "get_photos_by_album",
        },
        on_failure: {
          next: "error",
        },
      },
      {
        slug: "get_photos_by_album",
        api: "get_photos_by_album",
        on_success: {
          next: "complete",
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
