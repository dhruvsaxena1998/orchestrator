import { Router } from "express";

const router = Router();

import Workflows from "../assets/workflow";
import APIs from "../assets/api";

import {
  buildRequest,
  processRequest,
  RequestContext,
} from "../services/Task.service";

const workflows = Workflows();
const apis = APIs();

router.post("/:version/:slug", async (req, res) => {
  const workflow = workflows.find(
    (w) => w.version === req.params.version && w.slug === req.params.slug
  );

  if (!workflow) {
    res.status(404).send({
      message: "Workflow not found",
      version: req.params.version,
      slug: req.params.slug,
    });
    return;
  }

  const context: RequestContext = {
    body: req.body,
    query: req.query,
    params: req.params,
    headers: req.headers,
    response: {},
  };

  for (const step of workflow.steps) {
    const api = apis.find((x) => x.slug === step.api);
    if (!api) {
      context.response[step.slug] = {
        status: 404,
        message: "API not found",
      };
      continue;
    }

    const request = buildRequest(api, context);
    if (request.isErr()) {
      context.response[step.slug] = {
        status: 400,
        message: "Invalid request",
        error: request.error,
      };
      continue;
    }

    const result = await processRequest(request.value);
    if (result.isErr()) {
      context.response[step.slug] = {
        status: 500,
        message: "Error processing request",
        error: result.error,
      };
      continue;
    }

    context.response[step.slug] = result.value;
  }

  res.send({
    status: 200,
    response: context.response,
  });
});

export default router;
