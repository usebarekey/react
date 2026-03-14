import { afterEach, describe, expect, test } from "bun:test";
import { PublicBarekeyClient } from "@barekey/sdk/public";
import { Component, createElement } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

import { BarekeyProvider, useBarekey } from "../src/index.js";
import { resetBarekeyReactCacheForTests } from "../src/cache.js";
import { resetLeakGuardForTests } from "../src/leak-guard.js";

const originalFetch = globalThis.fetch;
const originalConsoleError = console.error;
const originalDocument = globalThis.document;
const originalWindow = globalThis.window;
const originalActEnvironment = (globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
}).IS_REACT_ACT_ENVIRONMENT;

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": "application/json",
    },
  });
}

function createDeferred<TValue = void>() {
  let resolve!: (value: TValue | PromiseLike<TValue>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<TValue>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return {
    promise,
    resolve,
    reject,
  };
}

function createTestDocument() {
  const elements: Array<{
    id: string;
    style: { cssText: string };
    innerHTML: string;
    remove(): void;
  }> = [];

  const document = {
    body: {
      appendChild(element: (typeof elements)[number]): void {
        elements.push(element);
      },
    },
    documentElement: {
      style: {
        overflow: "",
      },
    },
    createElement(): (typeof elements)[number] {
      const element = {
        id: "",
        style: {
          cssText: "",
        },
        innerHTML: "",
        remove(): void {
          const index = elements.indexOf(element);
          if (index >= 0) {
            elements.splice(index, 1);
          }
        },
      };
      return element;
    },
    getElementById(id: string) {
      return elements.find((element) => element.id === id) ?? null;
    },
  };

  return {
    document: document as unknown as Document,
    getOverlay(): { innerHTML: string } | null {
      return document.getElementById("__barekey_private_variable_overlay");
    },
  };
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  console.error = originalConsoleError;
  if (originalDocument === undefined) {
    delete globalThis.document;
  } else {
    globalThis.document = originalDocument;
  }
  if (originalWindow === undefined) {
    delete globalThis.window;
  } else {
    globalThis.window = originalWindow;
  }
  (
    globalThis as typeof globalThis & {
      IS_REACT_ACT_ENVIRONMENT?: boolean;
    }
  ).IS_REACT_ACT_ENVIRONMENT = originalActEnvironment;
  resetBarekeyReactCacheForTests();
  resetLeakGuardForTests();
});

function renderWithClient(input: {
  client?: PublicBarekeyClient;
  children: ReturnType<typeof createElement>;
}): ReturnType<typeof createElement> {
  if (input.client !== undefined) {
    return createElement(BarekeyProvider, {
      client: input.client,
      fallback: createElement("span", null, "loading"),
      children: input.children,
    });
  }

  return input.children;
}

type CaptureBoundaryProps = {
  children: ReturnType<typeof createElement>;
};

type CaptureBoundaryState = {
  error: Error | null;
};

class CaptureBoundary extends Component<CaptureBoundaryProps, CaptureBoundaryState> {
  override state: CaptureBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): CaptureBoundaryState {
    return {
      error,
    };
  }

  override render() {
    if (this.state.error !== null) {
      return createElement("span", null, this.state.error.message);
    }

    return this.props.children;
  }
}

describe("@barekey/react", () => {
  test("suspends and resolves a single public variable", async () => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    const fetchGate = createDeferred<void>();
    globalThis.fetch = (async () => {
      await fetchGate.promise;
      return jsonResponse({
        definitions: [
          {
            name: "PUBLIC_THEME",
            kind: "secret",
            declaredType: "string",
            visibility: "public",
            value: "dark",
          },
        ],
      });
    }) as typeof globalThis.fetch;

    const client = new PublicBarekeyClient({
      organization: "acme",
      project: "web-react-single",
      environment: "production",
      baseUrl: "https://api.example.test",
    });

    function Theme() {
      const env = useBarekey();
      return createElement("span", null, env.get("PUBLIC_THEME"));
    }

    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = create(
        renderWithClient({
          client,
          children: createElement(Theme),
        }),
      );
    });

    expect(renderer.toJSON()).toEqual({
      type: "span",
      props: {},
      children: ["loading"],
    });

    await act(async () => {
      fetchGate.resolve();
      await fetchGate.promise;
      await Promise.resolve();
    });

    expect(renderer.toJSON()).toEqual({
      type: "span",
      props: {},
      children: ["dark"],
    });
  });

  test("preserves tuple ordering for array reads", async () => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    globalThis.fetch = (async (_input, init) => {
      expect(JSON.parse(String(init?.body ?? ""))).toEqual({
        orgSlug: "acme",
        projectSlug: "web-react-tuple",
        stageSlug: "production",
        names: ["PUBLIC_TITLE", "PUBLIC_THEME"],
      });

      return jsonResponse({
        definitions: [
          {
            name: "PUBLIC_THEME",
            kind: "secret",
            declaredType: "string",
            visibility: "public",
            value: "dark",
          },
          {
            name: "PUBLIC_TITLE",
            kind: "secret",
            declaredType: "string",
            visibility: "public",
            value: "hello",
          },
        ],
      });
    }) as typeof globalThis.fetch;

    const client = new PublicBarekeyClient({
      organization: "acme",
      project: "web-react-tuple",
      environment: "production",
      baseUrl: "https://api.example.test",
    });

    function PublicTuple() {
      const env = useBarekey();
      const [title, theme] = env.get(["PUBLIC_TITLE", "PUBLIC_THEME"] as const);
      return createElement("span", null, `${title}:${theme}`);
    }

    let renderer!: ReactTestRenderer;
    await act(async () => {
      renderer = create(
        renderWithClient({
          client,
          children: createElement(PublicTuple),
        }),
      );
      await Promise.resolve();
    });

    expect(renderer.toJSON()).toEqual({
      type: "span",
      props: {},
      children: ["hello:dark"],
    });
  });

  test("supports reads through a caller-provided public client", async () => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    globalThis.fetch = (async (_input, init) => {
      expect(JSON.parse(String(init?.body ?? ""))).toEqual({
        orgSlug: "acme",
        projectSlug: "web-react-json",
        stageSlug: "production",
        names: ["PUBLIC_THEME"],
      });

      return jsonResponse({
        definitions: [
          {
            name: "PUBLIC_THEME",
            kind: "secret",
            declaredType: "string",
            visibility: "public",
            value: "dark",
          },
        ],
      });
    }) as typeof globalThis.fetch;

    function Theme() {
      const env = useBarekey();
      return createElement("span", null, env.get("PUBLIC_THEME"));
    }

    const client = new PublicBarekeyClient({
      json: {
        organization: "acme",
        project: "web-react-json",
        environment: "production",
      },
      baseUrl: "https://api.example.test",
    });

    let renderer!: ReactTestRenderer;
    await act(async () => {
      renderer = create(
        renderWithClient({
          client,
          children: createElement(Theme),
        }),
      );
      await Promise.resolve();
    });

    expect(renderer.toJSON()).toEqual({
      type: "span",
      props: {},
      children: ["dark"],
    });
  });

  test("shows the leak overlay for fresh and cached private records", async () => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    const testDocument = createTestDocument();
    globalThis.document = testDocument.document;
    globalThis.window = {
      document: testDocument.document,
    } as unknown as Window & typeof globalThis;

    let fetchCount = 0;
    const consoleErrors: Array<string> = [];
    console.error = (...args: Array<unknown>) => {
      consoleErrors.push(args.join(" "));
    };
    globalThis.fetch = (async () => {
      fetchCount += 1;
      return jsonResponse({
        definitions: [
          {
            name: '<img src=x onerror=alert("xss")>',
            kind: "secret",
            declaredType: "string",
            visibility: "private",
            value: "shh",
          },
        ],
      });
    }) as typeof globalThis.fetch;

    const client = new PublicBarekeyClient({
      organization: "acme",
      project: "web-react-leak",
      environment: "production",
      baseUrl: "https://api.example.test",
    });

    function LeakyValue() {
      const env = useBarekey();
      return createElement("span", null, env.get('<img src=x onerror=alert("xss")>'));
    }

    let renderer!: ReactTestRenderer;
    await act(async () => {
      renderer = create(
        renderWithClient({
          client,
          children: createElement(LeakyValue),
        }),
      );
      await Promise.resolve();
    });

    expect(fetchCount).toBe(1);
    expect(testDocument.getOverlay()?.innerHTML).toContain("&lt;img src=x onerror=alert(&quot;xss&quot;)&gt;");
    expect(testDocument.getOverlay()?.innerHTML).not.toContain('<img src=x onerror=alert("xss")>');
    expect(consoleErrors.some((message) => message.includes('<img src=x onerror=alert("xss")>'))).toBeTrue();

    resetLeakGuardForTests();

    await act(async () => {
      renderer.update(
        renderWithClient({
          client,
          children: createElement(LeakyValue),
        }),
      );
      await Promise.resolve();
    });

    expect(fetchCount).toBe(1);
    expect(testDocument.getOverlay()?.innerHTML).toContain("&lt;img src=x onerror=alert(&quot;xss&quot;)&gt;");
  });

  test("throws a clear error when used outside BarekeyProvider", () => {
    (
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT?: boolean;
      }
    ).IS_REACT_ACT_ENVIRONMENT = true;

    function NakedUseBarekey() {
      useBarekey();
      return createElement("span", null, "unreachable");
    }

    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = create(
        createElement(CaptureBoundary, {
          children: createElement(NakedUseBarekey),
        }),
      );
    });

    expect(renderer.toJSON()).toEqual({
      type: "span",
      props: {},
      children: [
        "[barekey/react] useBarekey() must be used within <BarekeyProvider client={new PublicBarekeyClient(...)} ...>.",
      ],
    });
  });
});
