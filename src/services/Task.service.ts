import axios, { AxiosRequestConfig } from "axios";
import { ok, err } from "neverthrow";

import __get from "lodash/get";
import __cloneDeep from "lodash/cloneDeep";

import APIs from "../assets/api";
import { API, Step, Workflow } from "../validators/Workflow.validator";

const apis = APIs();

export type RequestContext = {
  body: NodeJS.Dict<unknown>;
  query: NodeJS.Dict<unknown>;
  params: NodeJS.Dict<unknown>;
  headers: NodeJS.Dict<unknown>;
  response: NodeJS.Dict<unknown>;
};

export type StepResponse = {
  status: number;
  message?: string;
  error?: string;
  data?: unknown;
};

const resolveValue = (key: string, context: RequestContext) => {
  const [section] = key.split(".");

  if (section in context) {
    return __get(context, key, key);
  }

  return key;
};

export const buildRequest = (api: API, context: RequestContext) => {
  try {
    const config: AxiosRequestConfig = {
      method: api.method,
      url: api.endpoint,
      params: {},
      data: {},
      headers: {},
    };

    if (api.request.params) {
      for (const [param, value] of Object.entries(api.request.params)) {
        const resolvedValue = resolveValue(value, context);
        config.url = config.url?.replace(
          `:${param}`,
          encodeURIComponent(resolvedValue)
        );
      }
    }

    if (api.request.query) {
      for (const [param, value] of Object.entries(api.request.query)) {
        const resolvedValue = resolveValue(value, context);
        config.params[param] = resolvedValue;
      }
    }

    if (api.request.headers) {
      for (const [header, value] of Object.entries(api.request.headers)) {
        const resolvedValue = resolveValue(value, context);
        if (!config.headers) {
          config.headers = {};
        }

        config.headers[header] = resolvedValue;
      }
    }

    if (api.method !== "GET" && api.request.body) {
      for (const [param, value] of Object.entries(api.request.body)) {
        const resolvedValue = resolveValue(value, context);
        config.data[param] = resolvedValue;
      }
    }

    return ok(config);
  } catch (error) {
    if (error instanceof Error) {
      return err(error.message);
    }

    return err("Issue building request");
  }
};

export const processRequest = async (config: AxiosRequestConfig) => {
  try {
    const result = await axios(config);

    return ok({
      status: result.status,
      data: result.data,
    });
  } catch (error) {
    if (error instanceof Error) {
      return err(error.message);
    }

    return err("Issue processing request");
  }
};

export const getAPIBySlug = (slug: string) => {
  const api = apis.find((x) => x.slug === slug);

  if (!api) {
    return err("API not found");
  }

  return ok(api);
};

const _setStepResponse = (
  ctx: RequestContext,
  slug: string,
  response: StepResponse
) => {
  ctx.response[slug] = response;
};

const _getNextStep = (
  workflow: Workflow,
  currentStep: Step,
  event: "on_success" | "on_failure"
): Step | undefined => {
  const nextStep = currentStep[event];
  if (nextStep.next === "complete" || nextStep.next === "error") {
    return undefined;
  }

  if (nextStep.next === "step") {
    return workflow.steps.find((x) => x.slug === nextStep.slug);
  }
};

export const processWorkflow = async (
  workflow: Workflow,
  initialContext: RequestContext
) => {
  const context = __cloneDeep(initialContext);
  let currentStep: Step | undefined = workflow.steps[0];

  while (currentStep) {
    const api = getAPIBySlug(currentStep?.api);
    if (api.isErr()) {
      _setStepResponse(context, currentStep.slug, {
        status: 404,
        message: "API not found",
      });
      continue;
    }

    const request = buildRequest(api.value, context);
    if (request.isErr()) {
      _setStepResponse(context, currentStep.slug, {
        status: 400,
        message: "Invalid request",
        error: request.error,
      });

      continue;
    }

    const result = await processRequest(request.value);
    if (result.isErr()) {
      _setStepResponse(context, currentStep.slug, {
        status: 500,
        message: "Error processing request",
        error: result.error,
      });

      currentStep = _getNextStep(workflow, currentStep, "on_failure");
      continue;
    }

    _setStepResponse(context, currentStep.slug, result.value);
    currentStep = _getNextStep(workflow, currentStep, "on_success");
  }

  return context;
};
