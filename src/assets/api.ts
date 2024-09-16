import { type API, validateAPI } from "../validators/Workflow.validator";

const apis: API[] = [
  {
    slug: "get_user",
    endpoint: process.env.TYPICODE_API + "/users",
    method: "GET",
    request: {
      query: {
        id: "body.user_id",
      },
    },
  },
  {
    slug: "get_posts_by_user",
    endpoint: process.env.TYPICODE_API + "/posts",
    method: "GET",
    request: {
      query: {
        userId: "body.user_id",
      },
    },
  },
  {
    slug: "get_photos_by_album",
    endpoint: process.env.TYPICODE_API + "/albums/:album_id/photos",
    method: "GET",
    request: {
      params: {
        album_id: "body.album_id",
      },
    },
  },
];

export default () => {
  const validate = validateAPI(apis);
  if (validate.isErr()) {
    console.log(validate.error);
    throw new Error("Invalid API");
  }

  return validate.value;
};
