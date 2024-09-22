import { Router } from "express";

const router = Router();

import Workflows from "../assets/workflow";

import { processWorkflow, RequestContext } from "../services/Task.service";

const workflows = Workflows();

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

  const result = await processWorkflow(workflow, context);

  res.send({
    status: 200,
    response: result.response,
  });
});

export default router;
