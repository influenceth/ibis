export const parseJsonArg = (raw, label) => {
  if (!raw || raw === '') return {};
  if (typeof raw === 'object') return raw;

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON passed to ${label}`);
  }
};

export const printJson = (value) => {
  console.log(JSON.stringify(value, null, 2));
};
