import {
  prepareEvent,
  prepareContractCall,
  readContract,
  type BaseTransactionOptions,
  type AbiParameterToPrimitiveType,
} from "thirdweb";

/**
* Contract events
*/

/**
 * Represents the filters for the "GameScoreError" event.
 */
export type GameScoreErrorEventFilters = Partial<{
  gameId: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"uint256","name":"gameId","type":"uint256"}>
}>;

/**
 * Creates an event object for the GameScoreError event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { gameScoreErrorEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  gameScoreErrorEvent({
 *  gameId: ...,
 * })
 * ],
 * });
 * ```
 */
export function gameScoreErrorEvent(filters: GameScoreErrorEventFilters = {}) {
  return prepareEvent({
    signature: "event GameScoreError(uint256 indexed gameId, bytes error)",
    filters,
  });
};
  

/**
 * Represents the filters for the "GameScoresRequested" event.
 */
export type GameScoresRequestedEventFilters = Partial<{
  gameId: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"uint256","name":"gameId","type":"uint256"}>
}>;

/**
 * Creates an event object for the GameScoresRequested event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { gameScoresRequestedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  gameScoresRequestedEvent({
 *  gameId: ...,
 * })
 * ],
 * });
 * ```
 */
export function gameScoresRequestedEvent(filters: GameScoresRequestedEventFilters = {}) {
  return prepareEvent({
    signature: "event GameScoresRequested(uint256 indexed gameId, bytes32 requestId)",
    filters,
  });
};
  

/**
 * Represents the filters for the "GameScoresUpdated" event.
 */
export type GameScoresUpdatedEventFilters = Partial<{
  gameId: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"uint256","name":"gameId","type":"uint256"}>
}>;

/**
 * Creates an event object for the GameScoresUpdated event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { gameScoresUpdatedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  gameScoresUpdatedEvent({
 *  gameId: ...,
 * })
 * ],
 * });
 * ```
 */
export function gameScoresUpdatedEvent(filters: GameScoresUpdatedEventFilters = {}) {
  return prepareEvent({
    signature: "event GameScoresUpdated(uint256 indexed gameId, bytes32 requestId)",
    filters,
  });
};
  

/**
 * Represents the filters for the "OwnershipTransferRequested" event.
 */
export type OwnershipTransferRequestedEventFilters = Partial<{
  from: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"from","type":"address"}>
to: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"to","type":"address"}>
}>;

/**
 * Creates an event object for the OwnershipTransferRequested event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { ownershipTransferRequestedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  ownershipTransferRequestedEvent({
 *  from: ...,
 *  to: ...,
 * })
 * ],
 * });
 * ```
 */
export function ownershipTransferRequestedEvent(filters: OwnershipTransferRequestedEventFilters = {}) {
  return prepareEvent({
    signature: "event OwnershipTransferRequested(address indexed from, address indexed to)",
    filters,
  });
};
  

/**
 * Represents the filters for the "OwnershipTransferred" event.
 */
export type OwnershipTransferredEventFilters = Partial<{
  from: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"from","type":"address"}>
to: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"to","type":"address"}>
}>;

/**
 * Creates an event object for the OwnershipTransferred event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { ownershipTransferredEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  ownershipTransferredEvent({
 *  from: ...,
 *  to: ...,
 * })
 * ],
 * });
 * ```
 */
export function ownershipTransferredEvent(filters: OwnershipTransferredEventFilters = {}) {
  return prepareEvent({
    signature: "event OwnershipTransferred(address indexed from, address indexed to)",
    filters,
  });
};
  

/**
 * Represents the filters for the "RequestFulfilled" event.
 */
export type RequestFulfilledEventFilters = Partial<{
  id: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"bytes32","name":"id","type":"bytes32"}>
}>;

/**
 * Creates an event object for the RequestFulfilled event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { requestFulfilledEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  requestFulfilledEvent({
 *  id: ...,
 * })
 * ],
 * });
 * ```
 */
export function requestFulfilledEvent(filters: RequestFulfilledEventFilters = {}) {
  return prepareEvent({
    signature: "event RequestFulfilled(bytes32 indexed id)",
    filters,
  });
};
  

/**
 * Represents the filters for the "RequestSent" event.
 */
export type RequestSentEventFilters = Partial<{
  id: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"bytes32","name":"id","type":"bytes32"}>
}>;

/**
 * Creates an event object for the RequestSent event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { requestSentEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  requestSentEvent({
 *  id: ...,
 * })
 * ],
 * });
 * ```
 */
export function requestSentEvent(filters: RequestSentEventFilters = {}) {
  return prepareEvent({
    signature: "event RequestSent(bytes32 indexed id)",
    filters,
  });
};
  

/**
* Contract read functions
*/



/**
 * Calls the "GAME_SCORE_REQUEST_COOLDOWN" function on the contract.
 * @param options - The options for the GAME_SCORE_REQUEST_COOLDOWN function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { GAME_SCORE_REQUEST_COOLDOWN } from "TODO";
 *
 * const result = await GAME_SCORE_REQUEST_COOLDOWN();
 *
 * ```
 */
export async function GAME_SCORE_REQUEST_COOLDOWN(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xb917e07b",
  [],
  [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ]
],
    params: []
  });
};




/**
 * Calls the "SOURCE" function on the contract.
 * @param options - The options for the SOURCE function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { SOURCE } from "TODO";
 *
 * const result = await SOURCE();
 *
 * ```
 */
export async function SOURCE(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xf230b4c2",
  [],
  [
    {
      "internalType": "string",
      "name": "",
      "type": "string"
    }
  ]
],
    params: []
  });
};




/**
 * Calls the "checkIfTournamentEndedIrl" function on the contract.
 * @param options - The options for the checkIfTournamentEndedIrl function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { checkIfTournamentEndedIrl } from "TODO";
 *
 * const result = await checkIfTournamentEndedIrl();
 *
 * ```
 */
export async function checkIfTournamentEndedIrl(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xf125ce1a",
  [],
  [
    {
      "internalType": "bool",
      "name": "",
      "type": "bool"
    }
  ]
],
    params: []
  });
};


/**
 * Represents the parameters for the "gameScoreErrors" function.
 */
export type GameScoreErrorsParams = {
  gameId: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"gameId","type":"uint256"}>
};

/**
 * Calls the "gameScoreErrors" function on the contract.
 * @param options - The options for the gameScoreErrors function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { gameScoreErrors } from "TODO";
 *
 * const result = await gameScoreErrors({
 *  gameId: ...,
 * });
 *
 * ```
 */
export async function gameScoreErrors(
  options: BaseTransactionOptions<GameScoreErrorsParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x4fbab317",
  [
    {
      "internalType": "uint256",
      "name": "gameId",
      "type": "uint256"
    }
  ],
  [
    {
      "internalType": "bytes",
      "name": "error",
      "type": "bytes"
    }
  ]
],
    params: [options.gameId]
  });
};


/**
 * Represents the parameters for the "gameScoreLastRequestTime" function.
 */
export type GameScoreLastRequestTimeParams = {
  gameId: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"gameId","type":"uint256"}>
};

/**
 * Calls the "gameScoreLastRequestTime" function on the contract.
 * @param options - The options for the gameScoreLastRequestTime function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { gameScoreLastRequestTime } from "TODO";
 *
 * const result = await gameScoreLastRequestTime({
 *  gameId: ...,
 * });
 *
 * ```
 */
export async function gameScoreLastRequestTime(
  options: BaseTransactionOptions<GameScoreLastRequestTimeParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x4b5282ab",
  [
    {
      "internalType": "uint256",
      "name": "gameId",
      "type": "uint256"
    }
  ],
  [
    {
      "internalType": "uint256",
      "name": "lastUpdatedTimestamp",
      "type": "uint256"
    }
  ]
],
    params: [options.gameId]
  });
};


/**
 * Represents the parameters for the "gameScoreRequests" function.
 */
export type GameScoreRequestsParams = {
  requestId: AbiParameterToPrimitiveType<{"internalType":"bytes32","name":"requestId","type":"bytes32"}>
};

/**
 * Calls the "gameScoreRequests" function on the contract.
 * @param options - The options for the gameScoreRequests function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { gameScoreRequests } from "TODO";
 *
 * const result = await gameScoreRequests({
 *  requestId: ...,
 * });
 *
 * ```
 */
export async function gameScoreRequests(
  options: BaseTransactionOptions<GameScoreRequestsParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x144de55c",
  [
    {
      "internalType": "bytes32",
      "name": "requestId",
      "type": "bytes32"
    }
  ],
  [
    {
      "internalType": "uint256",
      "name": "gameId",
      "type": "uint256"
    }
  ]
],
    params: [options.requestId]
  });
};


/**
 * Represents the parameters for the "gameScores" function.
 */
export type GameScoresParams = {
  gameId: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"gameId","type":"uint256"}>
};

/**
 * Calls the "gameScores" function on the contract.
 * @param options - The options for the gameScores function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { gameScores } from "TODO";
 *
 * const result = await gameScores({
 *  gameId: ...,
 * });
 *
 * ```
 */
export async function gameScores(
  options: BaseTransactionOptions<GameScoresParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x6a30b21b",
  [
    {
      "internalType": "uint256",
      "name": "gameId",
      "type": "uint256"
    }
  ],
  [
    {
      "internalType": "uint256",
      "name": "id",
      "type": "uint256"
    },
    {
      "internalType": "uint8",
      "name": "homeQ1LastDigit",
      "type": "uint8"
    },
    {
      "internalType": "uint8",
      "name": "homeQ2LastDigit",
      "type": "uint8"
    },
    {
      "internalType": "uint8",
      "name": "homeQ3LastDigit",
      "type": "uint8"
    },
    {
      "internalType": "uint8",
      "name": "homeFLastDigit",
      "type": "uint8"
    },
    {
      "internalType": "uint8",
      "name": "awayQ1LastDigit",
      "type": "uint8"
    },
    {
      "internalType": "uint8",
      "name": "awayQ2LastDigit",
      "type": "uint8"
    },
    {
      "internalType": "uint8",
      "name": "awayQ3LastDigit",
      "type": "uint8"
    },
    {
      "internalType": "uint8",
      "name": "awayFLastDigit",
      "type": "uint8"
    },
    {
      "internalType": "uint8",
      "name": "qComplete",
      "type": "uint8"
    },
    {
      "internalType": "bool",
      "name": "requestInProgress",
      "type": "bool"
    }
  ]
],
    params: [options.gameId]
  });
};


/**
 * Represents the parameters for the "getGameScores" function.
 */
export type GetGameScoresParams = {
  gameId: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"gameId","type":"uint256"}>
};

/**
 * Calls the "getGameScores" function on the contract.
 * @param options - The options for the getGameScores function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getGameScores } from "TODO";
 *
 * const result = await getGameScores({
 *  gameId: ...,
 * });
 *
 * ```
 */
export async function getGameScores(
  options: BaseTransactionOptions<GetGameScoresParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x55985b8f",
  [
    {
      "internalType": "uint256",
      "name": "gameId",
      "type": "uint256"
    }
  ],
  [
    {
      "internalType": "uint8",
      "name": "homeQ1LastDigit",
      "type": "uint8"
    },
    {
      "internalType": "uint8",
      "name": "homeQ2LastDigit",
      "type": "uint8"
    },
    {
      "internalType": "uint8",
      "name": "homeQ3LastDigit",
      "type": "uint8"
    },
    {
      "internalType": "uint8",
      "name": "homeFLastDigit",
      "type": "uint8"
    },
    {
      "internalType": "uint8",
      "name": "awayQ1LastDigit",
      "type": "uint8"
    },
    {
      "internalType": "uint8",
      "name": "awayQ2LastDigit",
      "type": "uint8"
    },
    {
      "internalType": "uint8",
      "name": "awayQ3LastDigit",
      "type": "uint8"
    },
    {
      "internalType": "uint8",
      "name": "awayFLastDigit",
      "type": "uint8"
    },
    {
      "internalType": "uint8",
      "name": "qComplete",
      "type": "uint8"
    },
    {
      "internalType": "bool",
      "name": "requestInProgress",
      "type": "bool"
    }
  ]
],
    params: [options.gameId]
  });
};




/**
 * Calls the "owner" function on the contract.
 * @param options - The options for the owner function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { owner } from "TODO";
 *
 * const result = await owner();
 *
 * ```
 */
export async function owner(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x8da5cb5b",
  [],
  [
    {
      "internalType": "address",
      "name": "",
      "type": "address"
    }
  ]
],
    params: []
  });
};


/**
 * Represents the parameters for the "timeUntilCooldownExpires" function.
 */
export type TimeUntilCooldownExpiresParams = {
  gameId: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"gameId","type":"uint256"}>
};

/**
 * Calls the "timeUntilCooldownExpires" function on the contract.
 * @param options - The options for the timeUntilCooldownExpires function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { timeUntilCooldownExpires } from "TODO";
 *
 * const result = await timeUntilCooldownExpires({
 *  gameId: ...,
 * });
 *
 * ```
 */
export async function timeUntilCooldownExpires(
  options: BaseTransactionOptions<TimeUntilCooldownExpiresParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xc952b1bf",
  [
    {
      "internalType": "uint256",
      "name": "gameId",
      "type": "uint256"
    }
  ],
  [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ]
],
    params: [options.gameId]
  });
};


/**
* Contract write functions
*/



/**
 * Calls the "acceptOwnership" function on the contract.
 * @param options - The options for the "acceptOwnership" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { acceptOwnership } from "TODO";
 *
 * const transaction = acceptOwnership();
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function acceptOwnership(
  options: BaseTransactionOptions
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x79ba5097",
  [],
  []
],
    params: []
  });
};


/**
 * Represents the parameters for the "fetchGameScores" function.
 */
export type FetchGameScoresParams = {
  args: AbiParameterToPrimitiveType<{"internalType":"string[]","name":"args","type":"string[]"}>
subscriptionId: AbiParameterToPrimitiveType<{"internalType":"uint64","name":"subscriptionId","type":"uint64"}>
gasLimit: AbiParameterToPrimitiveType<{"internalType":"uint32","name":"gasLimit","type":"uint32"}>
jobId: AbiParameterToPrimitiveType<{"internalType":"bytes32","name":"jobId","type":"bytes32"}>
gameId: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"gameId","type":"uint256"}>
};

/**
 * Calls the "fetchGameScores" function on the contract.
 * @param options - The options for the "fetchGameScores" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { fetchGameScores } from "TODO";
 *
 * const transaction = fetchGameScores({
 *  args: ...,
 *  subscriptionId: ...,
 *  gasLimit: ...,
 *  jobId: ...,
 *  gameId: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function fetchGameScores(
  options: BaseTransactionOptions<FetchGameScoresParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0xda9bd1ab",
  [
    {
      "internalType": "string[]",
      "name": "args",
      "type": "string[]"
    },
    {
      "internalType": "uint64",
      "name": "subscriptionId",
      "type": "uint64"
    },
    {
      "internalType": "uint32",
      "name": "gasLimit",
      "type": "uint32"
    },
    {
      "internalType": "bytes32",
      "name": "jobId",
      "type": "bytes32"
    },
    {
      "internalType": "uint256",
      "name": "gameId",
      "type": "uint256"
    }
  ],
  [
    {
      "internalType": "bytes32",
      "name": "requestId",
      "type": "bytes32"
    }
  ]
],
    params: [options.args, options.subscriptionId, options.gasLimit, options.jobId, options.gameId]
  });
};


/**
 * Represents the parameters for the "handleOracleFulfillment" function.
 */
export type HandleOracleFulfillmentParams = {
  requestId: AbiParameterToPrimitiveType<{"internalType":"bytes32","name":"requestId","type":"bytes32"}>
response: AbiParameterToPrimitiveType<{"internalType":"bytes","name":"response","type":"bytes"}>
err: AbiParameterToPrimitiveType<{"internalType":"bytes","name":"err","type":"bytes"}>
};

/**
 * Calls the "handleOracleFulfillment" function on the contract.
 * @param options - The options for the "handleOracleFulfillment" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { handleOracleFulfillment } from "TODO";
 *
 * const transaction = handleOracleFulfillment({
 *  requestId: ...,
 *  response: ...,
 *  err: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function handleOracleFulfillment(
  options: BaseTransactionOptions<HandleOracleFulfillmentParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x0ca76175",
  [
    {
      "internalType": "bytes32",
      "name": "requestId",
      "type": "bytes32"
    },
    {
      "internalType": "bytes",
      "name": "response",
      "type": "bytes"
    },
    {
      "internalType": "bytes",
      "name": "err",
      "type": "bytes"
    }
  ],
  []
],
    params: [options.requestId, options.response, options.err]
  });
};


/**
 * Represents the parameters for the "transferOwnership" function.
 */
export type TransferOwnershipParams = {
  to: AbiParameterToPrimitiveType<{"internalType":"address","name":"to","type":"address"}>
};

/**
 * Calls the "transferOwnership" function on the contract.
 * @param options - The options for the "transferOwnership" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { transferOwnership } from "TODO";
 *
 * const transaction = transferOwnership({
 *  to: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function transferOwnership(
  options: BaseTransactionOptions<TransferOwnershipParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0xf2fde38b",
  [
    {
      "internalType": "address",
      "name": "to",
      "type": "address"
    }
  ],
  []
],
    params: [options.to]
  });
};


