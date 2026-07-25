/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { TapOrderStatusEmail, tapOrderSubject } from './tap-order-status.tsx'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: any) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'tap-order-status': {
    component: TapOrderStatusEmail,
    subject: (data) => tapOrderSubject(data),
    displayName: 'Tap Card order status update',
    previewData: {
      recipient: 'user@example.com',
      recipientName: 'Alex Rivera',
      stage: 'shipped',
      orderId: 'ord_1234',
      cardSerial: 'VF-000123',
      trackingNumber: '1Z999AA10123456784',
      trackingUrl: 'https://www.ups.com/track?tracknum=1Z999AA10123456784',
      profileUrl: 'https://verifiedly.app/alex',
    },
  },
}