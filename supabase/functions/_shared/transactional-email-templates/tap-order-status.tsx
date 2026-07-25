/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

export type TapOrderStage = 'paid' | 'shipped' | 'delivered' | 'activated'

export interface TapOrderStatusProps {
  recipient: string
  recipientName?: string
  stage: TapOrderStage
  orderId: string
  cardSerial?: string
  trackingNumber?: string
  trackingUrl?: string
  profileUrl?: string
}

const HEADLINE: Record<TapOrderStage, string> = {
  paid: 'Your Verifiedly Tap Card order is confirmed',
  shipped: 'Your Verifiedly Tap Card is on the way',
  delivered: 'Your Verifiedly Tap Card was delivered',
  activated: 'Your Verifiedly Tap Card is active',
}

const BODY: Record<TapOrderStage, string> = {
  paid: 'Thanks — we received your order and it is queued for fulfillment. We\'ll email you again when it ships.',
  shipped: 'Your card has shipped. Use the tracking link below to follow the delivery.',
  delivered: 'Your card was marked delivered. Tap it on any phone to open your Verifiedly profile.',
  activated: 'Your Tap Card is linked to your Verifiedly profile and ready to use.',
}

export const tapOrderSubject = (data: TapOrderStatusProps) =>
  HEADLINE[data.stage] || 'Verifiedly Tap Card update'

export const TapOrderStatusEmail = ({
  recipient, recipientName, stage, orderId, cardSerial, trackingNumber, trackingUrl, profileUrl,
}: TapOrderStatusProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{HEADLINE[stage]}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{HEADLINE[stage]}</Heading>
        <Text style={text}>Hi {recipientName || recipient},</Text>
        <Text style={text}>{BODY[stage]}</Text>

        <Section style={card}>
          <Text style={meta}>Order: {orderId}</Text>
          {cardSerial ? <Text style={meta}>Card: {cardSerial}</Text> : null}
          {trackingNumber ? <Text style={meta}>Tracking: {trackingNumber}</Text> : null}
        </Section>

        {stage === 'shipped' && trackingUrl ? (
          <Button style={button} href={trackingUrl}>Track your shipment</Button>
        ) : null}
        {(stage === 'delivered' || stage === 'activated') && profileUrl ? (
          <Button style={button} href={profileUrl}>View your profile</Button>
        ) : null}

        <Text style={footer}>
          Questions? Reply to this email or contact{' '}
          <Link href="mailto:support@verifiedly.app" style={link}>support@verifiedly.app</Link>.
          <br />BrownGlobal Holdings LLC · Verifiedly
        </Text>
      </Container>
    </Body>
  </Html>
)

export default TapOrderStatusEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#000000', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const card = { border: '1px solid #e5e5e5', borderRadius: '8px', padding: '14px 16px', margin: '8px 0 20px' }
const meta = { fontSize: '13px', color: '#555555', margin: '2px 0' }
const button = {
  backgroundColor: '#000000', color: '#ffffff', fontSize: '14px',
  borderRadius: '8px', padding: '12px 20px', textDecoration: 'none',
  display: 'inline-block',
}
const link = { color: '#000000', textDecoration: 'underline' }
const footer = { fontSize: '12px', color: '#888888', margin: '30px 0 0', lineHeight: '1.6' }