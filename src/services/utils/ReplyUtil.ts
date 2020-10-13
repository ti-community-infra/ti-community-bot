import { Reply } from "../reply";

export function combineReplay(reply: Reply<any>) {
  return `
${reply.message}

<details>
<summary>Details</summary>

**Tip**    : ${reply.tip ? reply.tip : "None"}

**Warning**: ${reply.warning ? reply.warning : "None"}
</details>
    `;
}
