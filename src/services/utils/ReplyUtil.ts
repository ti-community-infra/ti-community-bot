import { Reply } from "../reply";

export function combineReplay(replay: Reply<any>) {
  return `
${replay.message}

<details>
<summary>More</summary>

**Tip**    : ${replay.tip ? replay.tip : "None"}

**Warning**: ${replay.warning ? replay.warning : "None"}
</details>
    `;
}
