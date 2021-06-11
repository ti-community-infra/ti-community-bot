import { Reply } from "../../../lib/services/reply";
import { Status } from "../../../src/services/reply";
import { generateReplay } from "../../../src/services/utils/ReplyUtil";

describe("Reply Util", () => {
  test("combine the replay without tip and warning", () => {
    const reply: Reply<null> = {
      data: null,
      status: Status.Failed,
      message: "combine the replay without tip and warning",
    };

    const expectReply = `
${reply.message}

<details>
<summary>Details</summary>

**Tip**    : None

**Warning**: None
</details>
    `;

    expect(generateReplay(reply)).toBe(expectReply);
  });

  test("combine the replay with tip and warning", () => {
    const reply: Reply<null> = {
      data: null,
      status: Status.Failed,
      message: "combine the replay without tip and warning",
      tip: "Test",
      warning: "Test",
    };

    const expectReply = `
${reply.message}

<details>
<summary>Details</summary>

**Tip**    : Test

**Warning**: Test
</details>
    `;

    expect(generateReplay(reply)).toBe(expectReply);
  });
});
