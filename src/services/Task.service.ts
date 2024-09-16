import axios, { AxiosRequestConfig } from "axios";
import { ok, err } from "neverthrow";

import __get from "lodash/get";
import __cloneDeep from "lodash/cloneDeep";

import APIs from "../assets/api";
import { API, Step, Workflow } from "../validators/Workflow.validator";

const apis = APIs();

export type RequestContext = {
  body: Record<string, unknown>;
  query: Record<string, unknown>;
  params: Record<string, unknown>;
  headers: Record<string, unknown>;
  response: Record<string, unknown>;
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

export const processWorkflow = async (
  workflow: Workflow,
  initialContext: RequestContext
) => {
  const context = __cloneDeep(initialContext);
  let currentStep: Step | undefined = workflow.steps[0];

  while (currentStep) {
    const api = apis.find((x) => x.slug === currentStep?.api);
    if (!api) {
      context.response[currentStep.slug] = {
        status: 404,
        message: "API not found",
      };
      continue;
    }
    const request = buildRequest(api, context);
    if (request.isErr()) {
      context.response[currentStep.slug] = {
        status: 400,
        message: "Invalid request",
        error: request.error,
      };
      continue;
    }

    const result = await processRequest(request.value);

    if (result.isErr()) {
      continue;
    }

    context.response[currentStep.slug] = result.value;
  }
};
