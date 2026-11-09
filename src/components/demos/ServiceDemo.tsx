"use client";

import { useState } from "react";
import type { Lang } from "@/lib/i18n";
import { useTheme } from "../theme";
import { CloudBand } from "../ascii/CloudBand";
import { DepthFrame } from "../interactive";
import { ApiDemo } from "./ApiDemo";
import { AutomationDemo } from "./AutomationDemo";
import { StorefrontDemo } from "./StorefrontDemo";

const DEMOS = { storefront: StorefrontDemo, api: ApiDemo, automation: AutomationDemo };

/** A stageshow demo in its depth frame, with a Replay that remounts it at the story's start. */
export function ServiceDemo({ demo, label, replay, lang }: { demo: keyof typeof DEMOS; label: string; replay: string; lang: Lang }) {
  const [run, setRun] = useState(0);
  const theme = useTheme();
  const Demo = DEMOS[demo];
  return (
    <figure className="service-demo">
      <DepthFrame back={<CloudBand className="depth__clouds" bank="even" cover={0.42} size={11} interactive={false} offset={demo.length} speed={0.6} />}>
        <Demo key={run} lang={lang} theme={theme} />
      </DepthFrame>
      <figcaption className="service-demo__cap">
        <span className="label">{label}</span>
        <button type="button" className="replay" onClick={() => setRun((n) => n + 1)}>
          {replay}
        </button>
      </figcaption>
    </figure>
  );
}
