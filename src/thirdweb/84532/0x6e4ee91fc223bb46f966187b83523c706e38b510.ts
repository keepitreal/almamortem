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
 * Represents the filters for the "BracketEntered" event.
 */
export type BracketEnteredEventFilters = Partial<{
  tournamentId: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"uint256","name":"tournamentId","type":"uint256"}>
participant: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"participant","type":"address"}>
tokenId: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}>
}>;

/**
 * Creates an event object for the BracketEntered event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { bracketEnteredEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  bracketEnteredEvent({
 *  tournamentId: ...,
 *  participant: ...,
 *  tokenId: ...,
 * })
 * ],
 * });
 * ```
 */
export function bracketEnteredEvent(filters: BracketEnteredEventFilters = {}) {
  return prepareEvent({
    signature: "event BracketEntered(uint256 indexed tournamentId, address indexed participant, uint256 indexed tokenId)",
    filters,
  });
};
  

/**
 * Represents the filters for the "OwnershipTransferred" event.
 */
export type OwnershipTransferredEventFilters = Partial<{
  previousOwner: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"}>
newOwner: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}>
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
 *  previousOwner: ...,
 *  newOwner: ...,
 * })
 * ],
 * });
 * ```
 */
export function ownershipTransferredEvent(filters: OwnershipTransferredEventFilters = {}) {
  return prepareEvent({
    signature: "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
    filters,
  });
};
  

/**
 * Represents the filters for the "TournamentCreated" event.
 */
export type TournamentCreatedEventFilters = Partial<{
  tournamentId: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"uint256","name":"tournamentId","type":"uint256"}>
}>;

/**
 * Creates an event object for the TournamentCreated event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { tournamentCreatedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  tournamentCreatedEvent({
 *  tournamentId: ...,
 * })
 * ],
 * });
 * ```
 */
export function tournamentCreatedEvent(filters: TournamentCreatedEventFilters = {}) {
  return prepareEvent({
    signature: "event TournamentCreated(uint256 indexed tournamentId, uint256 entryFee, address paymentToken, uint256 startTime)",
    filters,
  });
};
  

/**
 * Represents the filters for the "TournamentFinalized" event.
 */
export type TournamentFinalizedEventFilters = Partial<{
  tournamentId: AbiParameterToPrimitiveType<{"indexed":true,"internalType":"uint256","name":"tournamentId","type":"uint256"}>
}>;

/**
 * Creates an event object for the TournamentFinalized event.
 * @param filters - Optional filters to apply to the event.
 * @returns The prepared event object.
 * @example
 * ```
 * import { getContractEvents } from "thirdweb";
 * import { tournamentFinalizedEvent } from "TODO";
 *
 * const events = await getContractEvents({
 * contract,
 * events: [
 *  tournamentFinalizedEvent({
 *  tournamentId: ...,
 * })
 * ],
 * });
 * ```
 */
export function tournamentFinalizedEvent(filters: TournamentFinalizedEventFilters = {}) {
  return prepareEvent({
    signature: "event TournamentFinalized(uint256 indexed tournamentId, address[] winners, uint256[] prizes)",
    filters,
  });
};
  

/**
* Contract read functions
*/



/**
 * Calls the "DEVELOPER_FEE" function on the contract.
 * @param options - The options for the DEVELOPER_FEE function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { DEVELOPER_FEE } from "TODO";
 *
 * const result = await DEVELOPER_FEE();
 *
 * ```
 */
export async function DEVELOPER_FEE(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xd56b7546",
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
 * Calls the "MAX_WINNERS" function on the contract.
 * @param options - The options for the MAX_WINNERS function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { MAX_WINNERS } from "TODO";
 *
 * const result = await MAX_WINNERS();
 *
 * ```
 */
export async function MAX_WINNERS(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x29a62a76",
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
 * Calls the "bracketNFT" function on the contract.
 * @param options - The options for the bracketNFT function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { bracketNFT } from "TODO";
 *
 * const result = await bracketNFT();
 *
 * ```
 */
export async function bracketNFT(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x893b2784",
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
 * Calls the "developerTreasury" function on the contract.
 * @param options - The options for the developerTreasury function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { developerTreasury } from "TODO";
 *
 * const result = await developerTreasury();
 *
 * ```
 */
export async function developerTreasury(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x78ac7a42",
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
 * Calls the "gameScoreOracle" function on the contract.
 * @param options - The options for the gameScoreOracle function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { gameScoreOracle } from "TODO";
 *
 * const result = await gameScoreOracle();
 *
 * ```
 */
export async function gameScoreOracle(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xdd17da4e",
  [],
  [
    {
      "internalType": "contract GameScoreOracle",
      "name": "",
      "type": "address"
    }
  ]
],
    params: []
  });
};


/**
 * Represents the parameters for the "getTournament" function.
 */
export type GetTournamentParams = {
  tournamentId: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"tournamentId","type":"uint256"}>
};

/**
 * Calls the "getTournament" function on the contract.
 * @param options - The options for the getTournament function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { getTournament } from "TODO";
 *
 * const result = await getTournament({
 *  tournamentId: ...,
 * });
 *
 * ```
 */
export async function getTournament(
  options: BaseTransactionOptions<GetTournamentParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x1a5bd7fc",
  [
    {
      "internalType": "uint256",
      "name": "tournamentId",
      "type": "uint256"
    }
  ],
  [
    {
      "internalType": "uint256",
      "name": "entryFee",
      "type": "uint256"
    },
    {
      "internalType": "address",
      "name": "paymentToken",
      "type": "address"
    },
    {
      "internalType": "uint256",
      "name": "startTime",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "prizePool",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "totalEntries",
      "type": "uint256"
    },
    {
      "internalType": "address[]",
      "name": "winners",
      "type": "address[]"
    }
  ]
],
    params: [options.tournamentId]
  });
};




/**
 * Calls the "isFinalizedIrl" function on the contract.
 * @param options - The options for the isFinalizedIrl function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { isFinalizedIrl } from "TODO";
 *
 * const result = await isFinalizedIrl();
 *
 * ```
 */
export async function isFinalizedIrl(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0xc8f6aa33",
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
 * Calls the "nextTournamentId" function on the contract.
 * @param options - The options for the nextTournamentId function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { nextTournamentId } from "TODO";
 *
 * const result = await nextTournamentId();
 *
 * ```
 */
export async function nextTournamentId(
  options: BaseTransactionOptions
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x852efc3d",
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
 * Represents the parameters for the "tournaments" function.
 */
export type TournamentsParams = {
  arg_0: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"","type":"uint256"}>
};

/**
 * Calls the "tournaments" function on the contract.
 * @param options - The options for the tournaments function.
 * @returns The parsed result of the function call.
 * @example
 * ```
 * import { tournaments } from "TODO";
 *
 * const result = await tournaments({
 *  arg_0: ...,
 * });
 *
 * ```
 */
export async function tournaments(
  options: BaseTransactionOptions<TournamentsParams>
) {
  return readContract({
    contract: options.contract,
    method: [
  "0x7503e1b7",
  [
    {
      "internalType": "uint256",
      "name": "",
      "type": "uint256"
    }
  ],
  [
    {
      "internalType": "uint256",
      "name": "entryFee",
      "type": "uint256"
    },
    {
      "internalType": "address",
      "name": "paymentToken",
      "type": "address"
    },
    {
      "internalType": "uint256",
      "name": "startTime",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "prizePool",
      "type": "uint256"
    },
    {
      "internalType": "uint256",
      "name": "totalEntries",
      "type": "uint256"
    }
  ]
],
    params: [options.arg_0]
  });
};


/**
* Contract write functions
*/

/**
 * Represents the parameters for the "createTournament" function.
 */
export type CreateTournamentParams = {
  entryFee: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"entryFee","type":"uint256"}>
paymentToken: AbiParameterToPrimitiveType<{"internalType":"address","name":"paymentToken","type":"address"}>
startTime: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"startTime","type":"uint256"}>
};

/**
 * Calls the "createTournament" function on the contract.
 * @param options - The options for the "createTournament" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { createTournament } from "TODO";
 *
 * const transaction = createTournament({
 *  entryFee: ...,
 *  paymentToken: ...,
 *  startTime: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function createTournament(
  options: BaseTransactionOptions<CreateTournamentParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x07814297",
  [
    {
      "internalType": "uint256",
      "name": "entryFee",
      "type": "uint256"
    },
    {
      "internalType": "address",
      "name": "paymentToken",
      "type": "address"
    },
    {
      "internalType": "uint256",
      "name": "startTime",
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
    params: [options.entryFee, options.paymentToken, options.startTime]
  });
};


/**
 * Represents the parameters for the "enterTournament" function.
 */
export type EnterTournamentParams = {
  participant: AbiParameterToPrimitiveType<{"internalType":"address","name":"participant","type":"address"}>
tournamentId: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"tournamentId","type":"uint256"}>
merkleRoot: AbiParameterToPrimitiveType<{"internalType":"bytes32","name":"merkleRoot","type":"bytes32"}>
tiebreaker: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"tiebreaker","type":"uint256"}>
bracketURI: AbiParameterToPrimitiveType<{"internalType":"string","name":"bracketURI","type":"string"}>
};

/**
 * Calls the "enterTournament" function on the contract.
 * @param options - The options for the "enterTournament" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { enterTournament } from "TODO";
 *
 * const transaction = enterTournament({
 *  participant: ...,
 *  tournamentId: ...,
 *  merkleRoot: ...,
 *  tiebreaker: ...,
 *  bracketURI: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function enterTournament(
  options: BaseTransactionOptions<EnterTournamentParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x424000bd",
  [
    {
      "internalType": "address",
      "name": "participant",
      "type": "address"
    },
    {
      "internalType": "uint256",
      "name": "tournamentId",
      "type": "uint256"
    },
    {
      "internalType": "bytes32",
      "name": "merkleRoot",
      "type": "bytes32"
    },
    {
      "internalType": "uint256",
      "name": "tiebreaker",
      "type": "uint256"
    },
    {
      "internalType": "string",
      "name": "bracketURI",
      "type": "string"
    }
  ],
  []
],
    params: [options.participant, options.tournamentId, options.merkleRoot, options.tiebreaker, options.bracketURI]
  });
};


/**
 * Represents the parameters for the "finalizeTournament" function.
 */
export type FinalizeTournamentParams = {
  tournamentId: AbiParameterToPrimitiveType<{"internalType":"uint256","name":"tournamentId","type":"uint256"}>
winners: AbiParameterToPrimitiveType<{"internalType":"address[]","name":"winners","type":"address[]"}>
prizes: AbiParameterToPrimitiveType<{"internalType":"uint256[]","name":"prizes","type":"uint256[]"}>
};

/**
 * Calls the "finalizeTournament" function on the contract.
 * @param options - The options for the "finalizeTournament" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { finalizeTournament } from "TODO";
 *
 * const transaction = finalizeTournament({
 *  tournamentId: ...,
 *  winners: ...,
 *  prizes: ...,
 * });
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function finalizeTournament(
  options: BaseTransactionOptions<FinalizeTournamentParams>
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x1cec445d",
  [
    {
      "internalType": "uint256",
      "name": "tournamentId",
      "type": "uint256"
    },
    {
      "internalType": "address[]",
      "name": "winners",
      "type": "address[]"
    },
    {
      "internalType": "uint256[]",
      "name": "prizes",
      "type": "uint256[]"
    }
  ],
  []
],
    params: [options.tournamentId, options.winners, options.prizes]
  });
};




/**
 * Calls the "renounceOwnership" function on the contract.
 * @param options - The options for the "renounceOwnership" function.
 * @returns A prepared transaction object.
 * @example
 * ```
 * import { renounceOwnership } from "TODO";
 *
 * const transaction = renounceOwnership();
 *
 * // Send the transaction
 * ...
 *
 * ```
 */
export function renounceOwnership(
  options: BaseTransactionOptions
) {
  return prepareContractCall({
    contract: options.contract,
    method: [
  "0x715018a6",
  [],
  []
],
    params: []
  });
};


/**
 * Represents the parameters for the "transferOwnership" function.
 */
export type TransferOwnershipParams = {
  newOwner: AbiParameterToPrimitiveType<{"internalType":"address","name":"newOwner","type":"address"}>
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
 *  newOwner: ...,
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
      "name": "newOwner",
      "type": "address"
    }
  ],
  []
],
    params: [options.newOwner]
  });
};


