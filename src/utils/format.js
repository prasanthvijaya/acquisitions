export const formatValidationErrors = (errors) => {
  if (!errors?.issues?.length) return 'Validation failed';

  return errors.issues.map((issue) => issue.message).join(', ');
};