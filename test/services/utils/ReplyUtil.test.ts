import { generateReplyMsg } from "../../../src/services/utils/ReplyUtil";

describe("Reply Util", () => {
  test("generate the reply with tip and warning", () => {
    let msg = "some messages"
    let details = "some details";

    const expectReply = `
some messages

<details>

some details

</details>
    `;

    expect(generateReplyMsg(msg,details)).toBe(expectReply);
  });
});
