/**
 * Enumeration of the parameter names defined by the CEF specification.
 *
 * The string value of each case is the exact, case-correct name that must
 * appear after the `#/` prefix in the generated file.
 */
export enum StandardParameter {
  Candidates = 'Candidates',
  NumberOfSeats = 'Number of Seats',
  ImplicitRanking = 'Implicit Ranking',
  VotingMethods = 'Voting Methods',
  WeightAllowed = 'Weight Allowed',
}
