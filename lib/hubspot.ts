import { Client } from '@hubspot/api-client'

const hubspot = new Client({
  accessToken: process.env.HUBSPOT_PRIVATE_APP_TOKEN || '',
})

export async function findOrCreateContact(contact: {
  email: string
  name: string
  company?: string
  phone?: string
}): Promise<string> {
  try {
    const searchResponse = await hubspot.crm.contacts.searchApi.doSearch({
      filterGroups: [
        {
          filters: [
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            { propertyName: 'email', operator: 'EQ', value: contact.email } as any,
          ],
        },
      ],
      properties: ['email', 'firstname', 'lastname', 'company'],
      limit: 1,
      after: '0',
      sorts: [],
    })
    if (searchResponse.results.length > 0) {
      return searchResponse.results[0].id
    }
  } catch {
    // Contact doesn't exist, create it
  }

  const nameParts = contact.name.split(' ')
  const firstName = nameParts[0]
  const lastName = nameParts.slice(1).join(' ')

  const createResponse = await hubspot.crm.contacts.basicApi.create({
    properties: {
      email: contact.email,
      firstname: firstName,
      lastname: lastName,
      company: contact.company || '',
      phone: contact.phone || '',
    },
    associations: [],
  })
  return createResponse.id
}

export async function syncMeetingToHubSpot(meeting: {
  id: string
  title: string
  startTime: Date
  endTime: Date
  contactHubspotId?: string | null
  hubspotContactId?: string | null
  notes?: string | null
  hubspotDealId?: string | null
}): Promise<void> {
  try {
    // Create a meeting engagement
    await hubspot.apiRequest({
      method: 'POST',
      path: '/crm/v3/objects/meetings',
      body: {
        properties: {
          hs_meeting_title: meeting.title,
          hs_meeting_start_time: meeting.startTime.toISOString(),
          hs_meeting_end_time: meeting.endTime.toISOString(),
          hs_meeting_body: meeting.notes || '',
          hs_internal_meeting_notes: `Concierge Meeting ID: ${meeting.id}`,
        },
      },
    })

    // Update contact property
    const contactId = meeting.contactHubspotId || meeting.hubspotContactId
    if (!contactId) return
    await hubspot.crm.contacts.basicApi.update(contactId, {
      properties: {
        last_conference_meeting_date: meeting.startTime.toISOString().split('T')[0],
      },
    })

    // Associate with deal if provided
    if (meeting.hubspotDealId) {
      await hubspot.crm.deals.basicApi.update(meeting.hubspotDealId, {
        properties: {
          dealstage: 'meetingscheduled',
        },
      })
    }
  } catch (error) {
    console.error('[HubSpot] Sync error:', error)
  }
}

export async function completeMeetingInHubSpot(params: {
  contactHubspotId: string
  hubspotDealId?: string | null
  outcome: string
  notes: string
}): Promise<void> {
  try {
    // Add note to contact timeline
    await hubspot.apiRequest({
      method: 'POST',
      path: '/crm/v3/objects/notes',
      body: {
        properties: {
          hs_note_body: params.notes,
          hs_timestamp: new Date().toISOString(),
        },
      },
    })

    if (params.hubspotDealId && params.outcome === 'completed') {
      await hubspot.crm.deals.basicApi.update(params.hubspotDealId, {
        properties: {
          dealstage: 'meetingheld',
        },
      })
    }
  } catch (error) {
    console.error('[HubSpot] Complete meeting error:', error)
  }
}

export async function searchContacts(query: string) {
  try {
    const response = await hubspot.crm.contacts.searchApi.doSearch({
      query,
      properties: ['email', 'firstname', 'lastname', 'company', 'phone'],
      limit: 10,
      after: '0',
      sorts: [],
      filterGroups: [],
    })
    return response.results.map((c) => ({
      id: c.id,
      name: `${c.properties.firstname || ''} ${c.properties.lastname || ''}`.trim(),
      email: c.properties.email || '',
      company: c.properties.company || '',
      phone: c.properties.phone || '',
    }))
  } catch {
    return []
  }
}
