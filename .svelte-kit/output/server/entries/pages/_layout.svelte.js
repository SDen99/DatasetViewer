import { C as head, B as pop, z as push } from "../../chunks/index.js";
function _layout($$payload, $$props) {
  push();
  let { children } = $$props;
  head($$payload, ($$payload2) => {
    $$payload2.out += `<link rel="icon" href="./static/favicon.ico">`;
  });
  children($$payload);
  $$payload.out += `<!---->`;
  pop();
}
export {
  _layout as default
};
