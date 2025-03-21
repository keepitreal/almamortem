export type Call = {
  to: `0x${string}`;
  data: `0x${string}`;
  value?: bigint;
};