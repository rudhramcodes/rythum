const steps = {
  New: {
    admin: ['Review this inquiry', 'Check the event brief and discuss availability with the client.', 'Start conversation'],
    customer: ['Your inquiry is with the team', 'The team will review your event. You can share any extra information in the conversation.', 'Message the team'],
  },
  'In discussion': {
    admin: ['Agree on the event requirements', 'Clarify the date, venue and performance requirements before discussing pricing.', 'Continue conversation'],
    customer: ['Let’s plan your event', 'Use the conversation to discuss your requirements and ask questions.', 'Open conversation'],
  },
  Quoted: {
    admin: ['Check the client’s decision', 'Follow up on the quote shared with the client and record any requested changes.', 'Follow up with client'],
    customer: ['Discuss your quote', 'Review the quote shared by the team. Ask about changes or tell them you would like to proceed.', 'Discuss with the team'],
  },
  Confirmed: {
    admin: ['Prepare for the event', 'Confirm timings, venue contacts and required documents with the client.', 'Coordinate event details'],
    customer: ['Your booking is confirmed', 'Keep timings, venue details and documents together here. Discuss any changes with the team.', 'Message the team'],
  },
  Closed: {
    admin: ['This inquiry is closed', 'Review the notes for context. Reopen only after discussing the next steps with the client.', 'View conversation'],
    customer: ['This inquiry is closed', 'Your conversation and documents remain available. Contact the team if you have any questions.', 'View conversation'],
  },
};
export function inquiryNextStep(status, audience) {
  const [title, description, action] = (steps[status] || steps.New)[audience === 'admin' ? 'admin' : 'customer'];
  return { title, description, action };
}
