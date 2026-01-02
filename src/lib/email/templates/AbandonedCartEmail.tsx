import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components';
import React from 'react';

interface AbandonedCartEmailProps {
  customerName: string;
  items: Array<{
    name: string;
    price: number;
    image: string;
  }>;
  checkoutUrl: string;
}

export const AbandonedCartEmail = ({
  customerName = 'Valued Customer',
  items = [],
  checkoutUrl = 'https://legacy.store/checkout',
}: AbandonedCartEmailProps) => (
  <Html>
    <Head />
    <Preview>You left something behind in your cart!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Legacy Store</Heading>
        <Text style={text}>Hi {customerName},</Text>
        <Text style={text}>
          We noticed you left some items in your cart. They are selling out fast, so secure them now!
        </Text>

        <Section style={itemSection}>
          {items.map((item, index) => (
             <div key={index} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                {item.image && (
                    <Img src={item.image} width="64" height="64" alt={item.name} style={{ borderRadius: '8px', objectFit: 'cover' }} />
                )}
                <div>
                    <Text style={{ ...text, margin: 0, fontWeight: 600 }}>{item.name}</Text>
                    <Text style={{ ...text, margin: 0, color: '#666' }}>EGP {item.price.toLocaleString()}</Text>
                </div>
             </div>
          ))}
        </Section>
        
        <Hr style={{ borderColor: '#e6e6e6', margin: '20px 0' }} />

        <Section style={btnContainer}>
          <Button style={button} href={checkoutUrl}>
            Complete Your Order
          </Button>
        </Section>
        
        <Text style={footer}>
          If you have any questions, reply to this email.
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '560px',
};

const h1 = {
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '30px 0',
  color: '#12403C',
};

const text = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#333',
};

const itemSection = {
  padding: '24px',
  backgroundColor: '#f9f9f9',
  borderRadius: '12px',
};

const btnContainer = {
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#12403C',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px',
};

const footer = {
  fontSize: '12px',
  color: '#8898aa',
  marginTop: '20px',
  textAlign: 'center' as const,
};

export default AbandonedCartEmail;
