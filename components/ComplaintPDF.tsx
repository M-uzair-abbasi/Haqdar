import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { OverchargeResult } from "@/types";

export interface ComplaintPDFProps {
  consumerName: string;
  cnic: string;
  mobile: string;
  email: string;
  address: string;
  discoName: string;
  referenceNumber: string;
  billDate: string;
  billingPeriod: string;
  overcharges: OverchargeResult[];
  totalRefund: number;
  date: string;
  language: "english" | "urdu" | "both";
  complaintTextEnglish: string;
  complaintTextUrdu: string;
}

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 11, lineHeight: 1.55 },
  urduPage: { padding: 40, fontFamily: "Helvetica", fontSize: 11, lineHeight: 1.7, textAlign: "right" },
  header: { fontSize: 13, fontWeight: "bold", marginBottom: 12, textAlign: "center" },
  subject: { fontSize: 12, fontWeight: "bold", marginTop: 10, marginBottom: 12 },
  paragraph: { marginTop: 4, marginBottom: 4 },
  violationCard: {
    padding: 10,
    marginTop: 8,
    marginBottom: 8,
    borderLeft: "3px solid #C1121F",
    backgroundColor: "#FEF2F2",
  },
  violationTitle: { fontSize: 11, fontWeight: "bold" },
  footer: { marginTop: 24, paddingTop: 14, borderTop: "1px solid #888", fontSize: 10, color: "#555" },
  totalBox: {
    marginTop: 14,
    padding: 10,
    backgroundColor: "#1B4332",
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
});

export function ComplaintPDF(props: ComplaintPDFProps) {
  const {
    consumerName,
    cnic,
    discoName,
    referenceNumber,
    billDate,
    billingPeriod,
    overcharges,
    totalRefund,
    date,
    mobile,
    email,
    address,
    language,
  } = props;

  const english = (
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>THE REGISTRAR{"\n"}NATIONAL ELECTRIC POWER REGULATORY AUTHORITY (NEPRA){"\n"}NEPRA TOWER, ATTATURK AVENUE (EAST), SECTOR G-5/1, ISLAMABAD</Text>
      <Text style={styles.paragraph}>Date: {date}</Text>
      <Text style={styles.subject}>
        Subject: COMPLAINT REGARDING OVERBILLING BY {discoName.toUpperCase()} — REFERENCE: {referenceNumber}
      </Text>
      <Text style={styles.paragraph}>Respected Sir/Madam,</Text>
      <Text style={styles.paragraph}>
        I, {consumerName}, holder of CNIC {cnic}, a registered consumer of {discoName} under reference number {referenceNumber}, hereby file this formal complaint regarding overbilling in my bill dated {billDate} covering the period {billingPeriod}.
      </Text>
      <Text style={[styles.paragraph, { fontWeight: "bold", marginTop: 12 }]}>SPECIFIC VIOLATIONS DETECTED:</Text>
      {overcharges.map((o, i) => (
        <View style={styles.violationCard} key={i}>
          <Text style={styles.violationTitle}>VIOLATION {i + 1}: {o.pattern_name}</Text>
          <Text>Amount Overcharged: Rs {o.overcharge_amount.toLocaleString()}</Text>
          <Text>Regulatory Citation: {o.sro_citation}</Text>
          <Text style={{ marginTop: 4 }}>{o.explanation_english}</Text>
        </View>
      ))}
      <View style={styles.totalBox}>
        <Text>TOTAL REFUND DEMANDED: Rs {totalRefund.toLocaleString()}</Text>
      </View>
      <Text style={[styles.paragraph, { marginTop: 14, fontWeight: "bold" }]}>LEGAL BASIS:</Text>
      <Text style={styles.paragraph}>
        Under NEPRA Act 1997 Section 26(1) and NEPRA Consumer Service Manual 2021, I am entitled to investigation within 15 working days, full refund of Rs {totalRefund.toLocaleString()}, adjustment in next billing cycle or direct credit, physical meter verification upon request, and cessation of the violation pattern.
      </Text>
      <Text style={styles.paragraph}>
        I respectfully request NEPRA to direct {discoName} to refund Rs {totalRefund.toLocaleString()} immediately, investigate the pattern, and provide written confirmation of resolution.
      </Text>
      <Text style={styles.paragraph}>Mobile: {mobile}</Text>
      <Text style={styles.paragraph}>Email: {email}</Text>
      <Text style={styles.paragraph}>Address: {address}</Text>
      <Text style={[styles.paragraph, { marginTop: 14 }]}>
        I certify that the information provided is true to the best of my knowledge and belief.
      </Text>
      <Text style={[styles.paragraph, { marginTop: 20 }]}>Yours sincerely,</Text>
      <Text style={styles.paragraph}>{consumerName}</Text>
      <Text style={styles.paragraph}>CNIC: {cnic}</Text>
      <Text style={styles.footer}>Generated via Haqdar.pk — Pakistan's Consumer Bill Audit Platform</Text>
    </Page>
  );

  const urdu = (
    <Page size="A4" style={styles.urduPage}>
      <Text style={styles.header}>NEPRA — National Electric Power Regulatory Authority{"\n"}Islamabad</Text>
      <Text style={styles.paragraph}>Date: {date}</Text>
      <Text style={styles.subject}>Subject: Overbilling complaint — {discoName} — Ref: {referenceNumber}</Text>
      <Text style={styles.paragraph}>Consumer: {consumerName} (CNIC {cnic})</Text>
      {overcharges.map((o, i) => (
        <View style={styles.violationCard} key={i}>
          <Text style={styles.violationTitle}>Violation {i + 1}: {o.pattern_name}</Text>
          <Text>Amount: Rs {o.overcharge_amount.toLocaleString()}</Text>
          <Text>Citation: {o.sro_citation}</Text>
          <Text style={{ marginTop: 4 }}>{o.explanation_urdu}</Text>
        </View>
      ))}
      <View style={styles.totalBox}>
        <Text>Total refund demanded: Rs {totalRefund.toLocaleString()}</Text>
      </View>
      <Text style={[styles.paragraph, { marginTop: 10 }]}>Mobile: {mobile} · Email: {email}</Text>
      <Text style={styles.paragraph}>Address: {address}</Text>
      <Text style={styles.footer}>Generated via Haqdar.pk</Text>
    </Page>
  );

  return (
    <Document>
      {(language === "english" || language === "both") && english}
      {(language === "urdu" || language === "both") && urdu}
    </Document>
  );
}

export default ComplaintPDF;
