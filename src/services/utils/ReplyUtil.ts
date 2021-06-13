export function generateReplyMsg(basicMsg: string, details: string) {
  return `
${basicMsg}

<details>

${details}

</details>
    `;
}
