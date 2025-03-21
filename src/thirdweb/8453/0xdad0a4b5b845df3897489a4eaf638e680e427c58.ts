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
 * Represents the filters for the "TournamentOver" event.
 */
export type TournamentOverEventFilters = Partial<{
  winningTeamId: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"uint256","name":"winningTeamId","type":"uint256"}>
}>;

/**
 * Creates an event object for the TournamentOver event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { tournamentOverEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  tournamentOverEvent({
 *  winningTeamId: ...,
 * })
 * ],
 * });
 * ```
 */
export function tournamentOverEvent(filters: TournamentOverEventFilters = {}) {
  return prepareEvent({
    signature: "event TournamentOver(uint256 indexed winningTeamId)",
    filters,
  });
};
  

/**
 * Represents the filters for the "WinUpdateError" event.
 */
export type WinUpdateErrorEventFilters = Partial<{
  requestId: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"bytes32","name":"requestId","type":"bytes32"}>
}>;

/**
 * Creates an event object for the WinUpdateError event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { winUpdateErrorEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  winUpdateErrorEvent({
 *  requestId: ...,
 * })
 * ],
 * });
 * ```
 */
export function winUpdateErrorEvent(filters: WinUpdateErrorEventFilters = {}) {
  return prepareEvent({
    signature: "event WinUpdateError(bytes32 indexed requestId, bytes error)",
    filters,
  });
};
  

/**
 * Represents the filters for the "WinsUpdateRequested" event.
 */
export type WinsUpdateRequestedEventFilters = Partial<{
  requestId: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"bytes32","name":"requestId","type":"bytes32"}>
}>;

/**
 * Creates an event object for the WinsUpdateRequested event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { winsUpdateRequestedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  winsUpdateRequestedEvent({
 *  requestId: ...,
 * })
 * ],
 * });
 * ```
 */
export function winsUpdateRequestedEvent(filters: WinsUpdateRequestedEventFilters = {}) {
  return prepareEvent({
    signature: "event WinsUpdateRequested(bytes32 indexed requestId)",
    filters,
  });
};
  

/**
 * Represents the filters for the "WinsUpdated" event.
 */
export type WinsUpdatedEventFilters = Partial<{
  requestId: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"bytes32","name":"requestId","type":"bytes32"}>
}>;

/**
 * Creates an event object for the WinsUpdated event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { winsUpdatedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  winsUpdatedEvent({
 *  requestId: ...,
 * })
 * ],
 * });
 * ```
 */
export function winsUpdatedEvent(filters: WinsUpdatedEventFilters = {}) {
  return prepareEvent({
    signature: "event WinsUpdated(bytes32 indexed requestId)",
    filters,
  });
};
  

/**
* Contract read functions
*/



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
 * Calls the "WIN_UPDATE_COOLDOWN" function on the contract.
 * @param options - The options for the WIN_UPDATE_COOLDOWN function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { WIN_UPDATE_COOLDOWN } from "TODO";
 *
 * const result = await WIN_UPDATE_COOLDOWN();
 *
 * ```
 */
export async function WIN_UPDATE_COOLDOWN(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x4069bc1c",
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
 * Represents the parameters for the "getTeamWins" function.
 */
export type GetTeamWinsParams = {
  teamId: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"teamId","type":"uint256"}>
};

/**
 * Calls the "getTeamWins" function on the contract.
 * @param options - The options for the getTeamWins function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getTeamWins } from "TODO";
 *
 * const result = await getTeamWins({
 *  teamId: ...,
 * });
 *
 * ```
 */
export async function getTeamWins(
  options: BaseTransactionOptions<GetTeamWinsParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x65c0b1ad",
  [
    {
      "internalType": "uint256",
      "name": "teamId",
      "type": "uint256"
    }
  ],
  [
    {
      "internalType": "uint8",
      "name": "",
      "type": "uint8"
    }
  ]
],
    params: [options.teamId]
  });
};


/**
 * Represents the parameters for the "getTeamWinsBatch" function.
 */
export type GetTeamWinsBatchParams = {
  teamIds: AbiParameterToPrimitiveType<{"internalType":"uint256[]","name":"teamIds","type":"uint256[]"}>
};

/**
 * Calls the "getTeamWinsBatch" function on the contract.
 * @param options - The options for the getTeamWinsBatch function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getTeamWinsBatch } from "TODO";
 *
 * const result = await getTeamWinsBatch({
 *  teamIds: ...,
 * });
 *
 * ```
 */
export async function getTeamWinsBatch(
  options: BaseTransactionOptions<GetTeamWinsBatchParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xceb2a37d",
  [
    {
      "internalType": "uint256[]",
      "name": "teamIds",
      "type": "uint256[]"
    }
  ],
  [
    {
      "internalType": "uint8[]",
      "name": "",
      "type": "uint8[]"
    }
  ]
],
    params: [options.teamIds]
  });
};




/**
 * Calls the "isTournamentOver" function on the contract.
 * @param options - The options for the isTournamentOver function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { isTournamentOver } from "TODO";
 *
 * const result = await isTournamentOver();
 *
 * ```
 */
export async function isTournamentOver(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x0629922f",
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
 * Calls the "lastUpdateTimestamp" function on the contract.
 * @param options - The options for the lastUpdateTimestamp function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { lastUpdateTimestamp } from "TODO";
 *
 * const result = await lastUpdateTimestamp();
 *
 * ```
 */
export async function lastUpdateTimestamp(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x14bcec9f",
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
 * Calls the "packedTeamDataBytes" function on the contract.
 * @param options - The options for the packedTeamDataBytes function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { packedTeamDataBytes } from "TODO";
 *
 * const result = await packedTeamDataBytes();
 *
 * ```
 */
export async function packedTeamDataBytes(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xbbf31d46",
  [],
  [
    {
      "internalType": "bytes",
      "name": "",
      "type": "bytes"
    }
  ]
],
    params: []
  });
};




/**
 * Calls the "timeUntilCooldownExpires" function on the contract.
 * @param options - The options for the timeUntilCooldownExpires function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { timeUntilCooldownExpires } from "TODO";
 *
 * const result = await timeUntilCooldownExpires();
 *
 * ```
 */
export async function timeUntilCooldownExpires(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x71de5cd9",
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
 * Represents the parameters for the "fetchTeamWins" function.
 */
export type FetchTeamWinsParams = {
  args: AbiParameterToPrimitiveType<{"internalType":"string[]","name":"args","type":"string[]"}>
subscriptionId: AbiParameterToPrimitiveType<{"internalType":"uint64","name":"subscriptionId","type":"uint64"}>
gasLimit: AbiParameterToPrimitiveType<{"internalType":"uint32","name":"gasLimit","type":"uint32"}>
jobId: AbiParameterToPrimitiveType<{"internalType":"bytes32","name":"jobId","type":"bytes32"}>
};

/**
 * Calls the "fetchTeamWins" function on the contract.
 * @param options - The options for the "fetchTeamWins" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { fetchTeamWins } from "TODO";
 *
 * const transaction = fetchTeamWins({
 *  args: ...,
 *  subscriptionId: ...,
 *  gasLimit: ...,
 *  jobId: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function fetchTeamWins(
  options: BaseTransactionOptions<FetchTeamWinsParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0xb07460af",
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
    params: [options.args, options.subscriptionId, options.gasLimit, options.jobId]
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
 * Represents the parameters for the "setIsTournamentOver" function.
 */
export type SetIsTournamentOverParams = {
  teamId: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"teamId","type":"uint256"}>
};

/**
 * Calls the "setIsTournamentOver" function on the contract.
 * @param options - The options for the "setIsTournamentOver" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { setIsTournamentOver } from "TODO";
 *
 * const transaction = setIsTournamentOver({
 *  teamId: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function setIsTournamentOver(
  options: BaseTransactionOptions<SetIsTournamentOverParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0xfbafd17d",
  [
    {
      "internalType": "uint256",
      "name": "teamId",
      "type": "uint256"
    }
  ],
  []
],
    params: [options.teamId]
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


