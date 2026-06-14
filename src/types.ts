export type GroupMetadata = {
  id: { server: 'g.us'; user: string; _serialized: string }
  // unix epoch time
  creation: number
  owner: { server: 'lid'; user: string; _serialized: string }
  subject: string
  // unix epoch time
  subjectTime: number
  desc: string
  descId: string
  // unix epoch time
  descTime: number
  descOwner: { server: 'lid'; user: string; _serialized: string }
  restrict: boolean
  announce: boolean
  noFrequentlyForwarded: boolean
  ephemeralDuration: number
  disappearingModeTrigger: string
  membershipApprovalMode: boolean
  memberAddMode: string
  memberLinkMode: string
  reportToAdminMode: boolean
  size: number
  support: boolean
  suspended: boolean
  terminated: boolean
  uniqueShortNameMap: Record<string, string>
  isLidAddressingMode: boolean
  isParentGroup: boolean
  isParentGroupClosed: boolean
  parentGroup: { server: 'g.us'; user: string; _serialized: string }
  defaultSubgroup: boolean
  generalSubgroup: boolean
  groupSafetyCheck: boolean
  generalChatAutoAddDisabled: boolean
  allowNonAdminSubGroupCreation: boolean
  lastActivityTimestamp: number
  lastSeenActivityTimestamp: number
  hasCapi: boolean
  participants: {
    id: { server: 'c.us' | 'lid'; user: string; _serialized: string }
    isAdmin: boolean
    isSuperAdmin: boolean
  }[]
  pendingParticipants: unknown[]
  pastParticipants: unknown[]
  membershipApprovalRequests: unknown[]
  subgroupSuggestions: unknown[]
}

export type MessageData = {
  id: { fromMe: boolean; remote: string; id: string; _serialized: string }
  rowId: number
  viewed: boolean
  body: string
  type: string
  t: number
  from?: { server: string; user: string; _serialized: string }
  to?: { server: string; user: string; _serialized: string }
  author?: { server: string; user: string; _serialized: string }
  ack: number
  invis: boolean
  star: boolean
  kicNotified: boolean
  isFromTemplate: boolean
  isAdsMedia: boolean
  pollOptions: unknown[]
  pollInvalidated: boolean
  pollVotesSnapshot: { pollVotes: unknown[] }
  latestEditMsgKey: null
  latestEditSenderTimestampMs: null
  broadcast: boolean
  mentionedJidList: unknown[]
  groupMentions: unknown[]
  eventInvalidated: boolean
  isVcardOverMmsDocument: boolean
  isForwarded: boolean
  isQuestion: boolean
  questionReplyQuotedMessage: null
  questionResponsesCount: number
  readQuestionResponsesCount: number
  forwardsCount: number
  hasReaction: boolean
  newsletterAdminProfile: null
  viewMode: string
  messageSecret: Record<string, number>
  productHeaderImageRejected: boolean
  lastPlaybackProgress: number
  isDynamicReplyButtonsMsg: boolean
  isCarouselCard: boolean
  parentMsgId: null
  callSilenceReason: null
  isVideoCall: boolean
  callDuration: null
  callCreator: null
  callParticipants: null
  isCallLink: null
  callLinkToken: null
  terminatedByDeviceSwitch: null
  selfOtherDeviceConnected: null
  isMdHistoryMsg: boolean
  stickerSentTs: number
  isAvatar: boolean
  lastUpdateFromServerTs: number
  invokedBotWid: null
  botTargetSenderJid: null
  bizBotType: null
  botResponseTargetId: null
  botPluginType: null
  botPluginReferenceIndex: null
  botPluginSearchProvider: null
  botPluginSearchUrl: null
  botPluginSearchQuery: null
  botPluginMaybeParent: false
  botReelPluginThumbnailCdnUrl: null
  botMessageDisclaimerText: null
  botSessionTransparencyType: null
  botMsgBodyType: null
  botModeSelection: null
  botModeOverride: null
  requiresDirectConnection: false
  bizContentPlaceholderType: null
  hostedBizEncStateMismatch: false
  senderOrRecipientAccountTypeHosted: false
  placeholderCreatedWhenAccountIsHosted: false
  groupHistoryBundleMessageKey: null
  groupHistoryBundleMetadata: null
  groupHistoryIndividualMessageInfo: null
  nonJidMentions: null
  links: unknown[]
}
