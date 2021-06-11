export function generateReplyMsg(basicMsg: string, details: string) {
  return `
${basicMsg}

<details>
<summary>Details</summary>
${details}
</details>
    `;
}
