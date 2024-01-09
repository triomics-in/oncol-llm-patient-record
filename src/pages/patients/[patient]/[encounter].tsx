import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  calculateAge,
  cn,
  formatCustomDate,
  formatDateWithSlash,
} from "@/lib/utils";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { Client } from "pg";
import { getSession } from "next-auth/react";

type iPatient = {
  // Set the type for the patient object from the server
  id: string;
  dob: string;
  sex: string;
  zip3: string;
  race: string;
  ethnicity: string;
  pcp: string;
  orders: {
    orderId: string;
    orderType: string;
    specimenTakenTime: string;
    contactDate: string;
    noteText: string;
  }[];
  diagnosis: {
    name: string;
    description: string;
    source: string;
    date: string;
  }[];
  hnoNotes: {
    noteNum: string;
    contactDate: string;
    noteType: string;
    noteText: string;
  }[];
  imagingReports: {
    orderProcId: string;
    specimenTakenTime: string;
    orderType: string;
    impressionContactDate: string;
    noteText: string;
  }[];
  procedures: {
    orderId: string;
    procedureSource: string;
    orderType: string;
    px: string;
    procedureName: string;
    providerName: string;
  }[];
};

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const session = await getSession(context);

  // redirect if not authenticated
  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const { patient: patient_num, encounter: encounter_num } = context.query;

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();

  const patient = (
    await client.query(
      `SELECT 
          d.patient_num, 
          d.birth_date_shifted, 
          d.sex, 
          d.zip3,
          d.race,
          d.ethnicity,
          d.state_c,
          d.primary_care_provider_name,
          (
              SELECT json_agg(diagnosis)
              FROM (
                  SELECT 
                      dx_name, 
                      dx_type, 
                      dx_source, 
                      dx_date_shifted 
                  FROM diagnosis 
                  WHERE patient_num = d.patient_num 
                  AND encounter_num = ${encounter_num}
                  ORDER BY dx_date_shifted DESC
              ) AS diagnosis
          ) AS patient_diagnosis,
          (
              SELECT json_agg(procedures)
              FROM (
                  SELECT 
                      order_id,
                      procedure_source, 
                      px, 
                      procedure_name, 
                      order_type_name,
                      provider_name 
                  FROM procedures 
                  WHERE patient_num = d.patient_num 
                  AND encounter_num = ${encounter_num}
              ) AS procedures
          ) AS patient_procedures,
          (
              SELECT json_agg(imaging_reports_deid)
              FROM (
                  SELECT 
                      order_proc_id, 
                      specimn_taken_time, 
                      order_type, 
                      impression_contact_date, 
                      note_text
                  FROM imaging_reports_deid 
                  WHERE patient_num = d.patient_num 
                  AND encounter_num = ${encounter_num}
                  ORDER BY impression_contact_date DESC
              ) AS imaging_reports_deid
          ) AS patient_imaging_reports_deid,
          (
              SELECT json_agg(hno_notes_deid)
              FROM (
                  SELECT 
                      note_num, 
                      contact_date, 
                      ip_note_type, 
                      contact_date,
                      note_text 
                  FROM hno_notes_deid 
                  WHERE patient_num = d.patient_num 
                  AND encounter_num = ${encounter_num}
                  ORDER BY contact_date DESC
              ) AS hno_notes_deid
          ) AS patient_hno_notes_deid,
          (
              SELECT json_agg(orders)
              FROM (
                  SELECT 
                      order_id, 
                      order_type,
                      specimn_taken_time, 
                      contact_date, 
                      note_text 
                  FROM order_results_deid 
                  WHERE patient_num = d.patient_num 
                  AND encounter_num = ${encounter_num}
                  ORDER BY contact_date DESC
              ) AS orders
          ) AS patient_orders
      FROM demographics AS d
      WHERE d.patient_num = ${patient_num};
      `
    )
  ).rows[0];

  let pat: iPatient = {
    id: patient.patient_num,
    dob: patient.birth_date_shifted,
    sex: patient.sex,
    zip3: patient.state_c + patient.zip3,
    race: patient.race,
    ethnicity: patient.ethnicity,
    pcp: patient.primary_care_provider_name,
    orders:
      patient?.patient_orders?.map(
        (order: {
          order_id: string;
          order_type: string;
          specimn_taken_time: string;
          contact_date: string;
          note_text: string;
        }) => ({
          orderId: order.order_id,
          orderType: order.order_type,
          specimenTakenTime: order.specimn_taken_time,
          contactDate: order.contact_date,
          noteText: order.note_text,
        })
      ) || [],
    diagnosis:
      patient?.patient_diagnosis?.map(
        (diagnosis: {
          dx_name: string;
          dx_type: string;
          dx_source: string;
          dx_date_shifted: string;
        }) => ({
          name: diagnosis.dx_name,
          description: diagnosis.dx_type,
          source: diagnosis.dx_source,
          date: diagnosis.dx_date_shifted,
        })
      ) || [],
    hnoNotes: patient?.patient_hno_notes_deid?.map(
      (hnoNote: {
        note_num: string;
        contact_date: string;
        ip_note_type: string;
        note_text: string;
      }) => ({
        noteNum: hnoNote.note_num,
        contactDate: hnoNote.contact_date,
        noteType: hnoNote.ip_note_type,
        noteText: hnoNote.note_text,
      })
    ),
    imagingReports: patient?.patient_imaging_reports_deid?.map(
      (imagingReport: {
        order_proc_id: string;
        specimn_taken_time: string;
        order_type: string;
        impression_contact_date: string;
        note_text: string;
      }) => ({
        orderProcId: imagingReport.order_proc_id,
        specimenTakenTime: imagingReport.specimn_taken_time,
        orderType: imagingReport.order_type,
        impressionContactDate: imagingReport.impression_contact_date,
        noteText: imagingReport.note_text,
      })
    ),
    procedures: patient?.patient_procedures?.map(
      (procedure: {
        order_id: string;
        procedure_source: string;
        px: string;
        procedure_name: string;
        order_type_name: string;
        provider_name: string;
      }) => ({
        orderId: procedure.order_id,
        procedureSource: procedure.procedure_source,
        px: procedure.px,
        procedureName: procedure.procedure_name,
        orderType: procedure.order_type_name,
        providerName: procedure.provider_name,
      })
    ),
  };

  await client.end();

  if (!pat || !pat.id)
    return {
      redirect: {
        destination: "/patients",
        permanent: false,
      },
    };

  return {
    props: {
      patient: JSON.parse(JSON.stringify(pat)),
    },
  };
};

export default function Encounter({ patient }: { patient: iPatient }) {
  const [diagnosisList, setDiagnosisList] = useState(5);
  const [ordersList, setOrdersList] = useState(5);
  const [hoNotesList, setHoNotesList] = useState(5);
  const [imagingReportsList, setImagingReportsList] = useState(5);
  const [proceduresList, setProceduresList] = useState(5);

  return (
    <div>
      <Card className="w-[95%] mx-auto my-7">
        <CardContent className="p-6">
          <div className="relative w-fit mx-auto">
            <h2 className="block font-semibold uppercase text-base text-blue-800">
              Patient Demographics
            </h2>
            <span className="absolute inset-x-0 -bottom-1 h-1 w-4 bg-blue-800"></span>
          </div>
          <div className="grid grid-cols-4 gap-5 mt-5">
            <Block title="Patient ID" value={patient.id} />
            <Block title="Gender" value={patient.sex} className="capitalize" />
            <Block title="DOB" value={formatDateWithSlash(patient.dob)} />
            <Block
              title="Age"
              value={calculateAge(patient.dob)}
              className="capitalize"
            />
            <Block title="Race" value={patient.race} />
            <Block title="Ethnicity" value={patient.ethnicity} />
            <Block title="PCP" value={patient.pcp} />
            <Block title="ZIP Code" value={patient.zip3} />
          </div>
        </CardContent>
      </Card>
      <Tabs defaultValue="diagnosis" className="w-[95%] mx-auto mb-10">
        <TabsList className="w-full flex items-center justify-start px-1">
          <TabsTrigger value="diagnosis">
            Diagnosis ({patient.diagnosis?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="procedures">
            Procedures ({patient.procedures?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="imagingReports">
            Imaging Reports ({patient.imagingReports?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="ordersNotes">
            Orders & Notes ({patient.orders?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="hoNotes">
            HNO Notes ({patient.hnoNotes?.length || 0})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="diagnosis">
          <Card>
            <CardHeader>
              <CardTitle>
                <Title title={"Diagnosis"} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Table>
                <TableHeader>
                  <TableRow className="uppercase font-semibold text-left">
                    <TableHead>Diagnosis Name</TableHead>
                    <TableHead className="w-[315px]">Diagnosis Type</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Date of Diagnosis</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patient?.diagnosis
                    ?.slice(0, diagnosisList)
                    .map((diagnosis) => (
                      <TableRow key={diagnosis.name}>
                        <TableCell>{diagnosis.name}</TableCell>
                        <TableCell className="truncate max-w-[315px]">
                          {diagnosis.description}
                        </TableCell>
                        <TableCell>{diagnosis.source}</TableCell>
                        <TableCell>
                          {formatCustomDate(diagnosis.date).split(",")[0]}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              {patient.diagnosis?.length > 5 && (
                <ShowMore
                  isActive={diagnosisList === patient?.diagnosis?.length}
                  controlHandler={() => {
                    if (diagnosisList === patient?.diagnosis?.length) {
                      setDiagnosisList(5);
                    } else {
                      setDiagnosisList(patient?.diagnosis?.length);
                    }
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="procedures">
          <Card>
            <CardHeader>
              <CardTitle>
                <Title title={"Procedures"} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Table>
                <TableHeader>
                  <TableRow className="uppercase font-semibold text-left">
                    <TableHead>Proc ID</TableHead>
                    <TableHead className="w-[315px]">
                      Procedure Source
                    </TableHead>
                    <TableHead>Px Text</TableHead>
                    <TableHead>Procedure Name</TableHead>
                    <TableHead>Order Type</TableHead>
                    <TableHead>Provider Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patient?.procedures
                    ?.slice(0, proceduresList)
                    .map((procedure) => (
                      <TableRow key={procedure.orderId}>
                        <TableCell>{procedure.orderId}</TableCell>
                        <TableCell>{procedure.procedureSource}</TableCell>
                        <TableCell>{procedure.px}</TableCell>
                        <TableCell>{procedure.procedureName}</TableCell>
                        <TableCell>{procedure.orderType}</TableCell>
                        <TableCell>{procedure.providerName}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              {patient.procedures?.length > 5 && (
                <ShowMore
                  isActive={proceduresList === patient?.procedures?.length}
                  controlHandler={() => {
                    if (proceduresList === patient?.procedures?.length) {
                      setProceduresList(5);
                    } else {
                      setProceduresList(patient?.procedures?.length);
                    }
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="imagingReports">
          <Card>
            <CardHeader>
              <CardTitle>
                <Title title={"Imaging Reports"} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Table>
                <TableHeader>
                  <TableRow className="uppercase font-semibold text-left">
                    <TableHead>Proc ID</TableHead>
                    <TableHead className="w-[315px]">
                      Specimen Taken Time
                    </TableHead>
                    <TableHead>Order Type</TableHead>
                    <TableHead>Contact Date</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patient?.imagingReports
                    ?.slice(0, imagingReportsList)
                    .map((imagingReport) => (
                      <TableRow key={imagingReport.orderProcId}>
                        <TableCell>{imagingReport.orderProcId}</TableCell>
                        <TableCell>
                          {formatCustomDate(imagingReport.specimenTakenTime)}
                        </TableCell>
                        <TableCell className="truncate max-w-[315px]">
                          {imagingReport.orderType}
                        </TableCell>
                        <TableCell>
                          {formatCustomDate(
                            imagingReport.impressionContactDate
                          )}
                        </TableCell>
                        <TableCell>
                          <ViewNote note={imagingReport.noteText} />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              {patient.imagingReports?.length > 5 && (
                <ShowMore
                  isActive={
                    imagingReportsList === patient?.imagingReports?.length
                  }
                  controlHandler={() => {
                    if (
                      imagingReportsList === patient?.imagingReports?.length
                    ) {
                      setImagingReportsList(5);
                    } else {
                      setImagingReportsList(patient?.imagingReports?.length);
                    }
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="ordersNotes">
          <Card>
            <CardHeader>
              <CardTitle>
                <Title title={"Orders & Notes"} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Table>
                <TableHeader>
                  <TableRow className="uppercase font-semibold text-left">
                    <TableHead>Order ID</TableHead>
                    <TableHead className="w-[315px]">
                      Specimen Taken Time
                    </TableHead>
                    <TableHead>Contact Date</TableHead>
                    <TableHead>Order Type</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patient?.orders?.slice(0, ordersList).map((order) => (
                    <TableRow key={order.orderId}>
                      <TableCell>{order.orderId}</TableCell>
                      <TableCell>
                        {formatCustomDate(order.specimenTakenTime)}
                      </TableCell>
                      <TableCell>
                        {formatCustomDate(order.contactDate)}
                      </TableCell>
                      <TableCell>{order.orderType}</TableCell>
                      <TableCell>
                        <ViewNote note={order.noteText} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {patient.orders?.length > 5 && (
                <ShowMore
                  isActive={ordersList === patient?.orders?.length}
                  controlHandler={() => {
                    if (ordersList === patient?.orders?.length) {
                      setOrdersList(5);
                    } else {
                      setOrdersList(patient?.orders?.length);
                    }
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="hoNotes">
          <Card>
            <CardHeader>
              <CardTitle>
                <Title title={"H&O Notes"} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Table>
                <TableHeader>
                  <TableRow className="uppercase font-semibold text-left">
                    <TableHead>Doc ID</TableHead>
                    <TableHead className="w-[315px]">Contact Date</TableHead>
                    <TableHead>Note Type</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patient?.hnoNotes?.slice(0, hoNotesList).map((hnoNote) => (
                    <TableRow key={hnoNote.noteNum}>
                      <TableCell>{hnoNote.noteNum}</TableCell>
                      <TableCell className="truncate max-w-[315px]">
                        {formatCustomDate(hnoNote.contactDate)}
                      </TableCell>
                      <TableCell>{hnoNote.noteType}</TableCell>
                      <TableCell>
                        <ViewNote note={hnoNote.noteText} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {patient.hnoNotes?.length > 5 && (
                <ShowMore
                  isActive={hoNotesList === patient?.hnoNotes?.length}
                  controlHandler={() => {
                    if (hoNotesList === patient?.hnoNotes?.length) {
                      setHoNotesList(5);
                    } else {
                      setHoNotesList(patient?.hnoNotes?.length);
                    }
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const Block = ({
  title,
  value,
  className,
}: {
  title: string;
  value: string;
  className?: string;
}) => (
  <div className={className}>
    <span className="text-sm text-gray-500 block">{title}</span>
    <span className="text-base font-semibold">{value}</span>
  </div>
);

export const ShowMore = ({
  isActive,
  controlHandler,
}: {
  isActive: boolean;
  controlHandler: () => void;
}) => {
  return (
    <div
      className={cn("text-blue-600 text-sm cursor-pointer block p-4 pb-0")}
      onClick={controlHandler}
    >
      View {isActive ? "Less" : "All"}
    </div>
  );
};

export const Title = ({ title }: { title: string }) => (
  <div className="relative">
    <span className="block font-semibold uppercase text-base text-blue-800">
      {title}
    </span>
    <span className="absolute inset-x-0 -bottom-1 h-1 w-4 bg-blue-800"></span>
  </div>
);

const ViewNote = ({ note }: { note: string | TrustedHTML }) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="text-sm cursor-pointer">
          <span className="text-blue-700 underline">View Note</span>
        </div>
      </SheetTrigger>
      <SheetContent className="min-w-[500px] flex flex-col">
        <SheetHeader className="relative -top-3">
          <SheetTitle>Note</SheetTitle>
        </SheetHeader>
        <div
          className="overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: note }}
        ></div>
      </SheetContent>
    </Sheet>
  );
};
