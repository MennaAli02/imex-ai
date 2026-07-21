**RIS-DCM Quick Reference**

Odoo models, fields, endpoints, and where each is used in the React code


# 1. Lookups (dropdown data) — src/data/seed.js -> src/data/DataContext.jsx

**React file:** src/data/DataContext.jsx (getAll(...) calls in every form/list)

GET /api/ris/lookups -> { users, insuranceCompanies, insurancePlans, categories,  
products, uoms, machines, discountReasons,  
reportTemplates, bodyParts, pricelists, basketLocations }

| **Collection key** | **Odoo model**          | **React fields -> Odoo fields**                                 |
|--------------------|-------------------------|------------------------------------------------------------------|
| users              | res.users               | id, name                                                         |
| insuranceCompanies | insurance.company       | id, name                                                         |
| insurancePlans     | insurance.plan          | id, name, companyId -> insurance_company_id                     |
| categories         | product.category        | id, name (domain: modality = True)                               |
| products           | product.template        | id, name, categoryId -> categ_id, price -> list_price, barcode |
| uoms               | uom.uom                 | id, name                                                         |
| machines           | machines                | id, name, assetId -> machine_name, categoryId -> categories    |
| discountReasons    | account.discount.reason | id, name, percentage, amount, deduct                             |
| reportTemplates    | report.model            | id, name -> temp_name, doctorId -> doctor_id                   |
| bodyParts          | body.part               | id, name, productId -> product_id                               |
| pricelists         | product.pricelist       | id, name                                                         |
| basketLocations    | stock.location          | id, name -> complete_name (domain: usage = internal)            |

## Selection options — src/data/seed.js (*_OPTIONS constants)

GET /api/ris/selections -> STATE_OPTIONS, REPORT_STATE_OPTIONS, STATE_OF_EXAM_OPTIONS,  
STATE2_OPTIONS, PATIENT_CONDITION_OPTIONS, PATIENT_TYPE_OPTIONS,  
PATIENT_STATE_OPTIONS, GENDER_OPTIONS_CAP, GENDER_OPTIONS_LOWER,  
DOCTOR_TYPE_OPTIONS, FILE_TYPE_OPTIONS

# 2. Patients

**React file:** src/pages/patients/PatientList.jsx, src/pages/patients/PatientForm.jsx

**Odoo model:** ris.patient

<table>
<colgroup>
<col style="width: 50%" />
<col style="width: 50%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Odoo model</strong></th>
<th><strong>Endpoints</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>ris.patient</td>
<td>GET /api/ris/patients<br />
GET /api/ris/patients/&lt;id&gt;<br />
POST /api/ris/patients<br />
PUT /api/ris/patients/&lt;id&gt;<br />
DELETE /api/ris/patients/&lt;id&gt;</td>
</tr>
</tbody>
</table>

| **React field** | **Odoo field**  | **Read-only** |
|-----------------|-----------------|---------------|
| nickname        | nickname        |               |
| firstName       | first_name      |               |
| middleName      | middle_name     |               |
| lastName        | last_name       |               |
| dob             | dob             |               |
| age             | age             | yes           |
| natId           | nat_id          |               |
| gender          | gender          |               |
| phone           | phone           |               |
| address         | address         |               |
| contractId      | contract        |               |
| plansId         | plans           |               |
| pid             | pid             | yes           |
| passportNumber  | passport_number |               |

# 3. Doctors

**React file:** src/pages/doctors/DoctorList.jsx, src/pages/doctors/DoctorForm.jsx

**Odoo model:** ris.doctor

<table>
<colgroup>
<col style="width: 50%" />
<col style="width: 50%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Odoo model</strong></th>
<th><strong>Endpoints</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>ris.doctor</td>
<td>GET /api/ris/doctors<br />
GET /api/ris/doctors/&lt;id&gt;<br />
POST /api/ris/doctors<br />
PUT /api/ris/doctors/&lt;id&gt;<br />
DELETE /api/ris/doctors/&lt;id&gt;</td>
</tr>
</tbody>
</table>

| **React field**         | **Odoo field**  | **Read-only**                    |
|-------------------------|-----------------|----------------------------------|
| partnerName / partnerId | partner_id      | resolved by name, see note below |
| specialization          | specialization  |                                  |
| degree                  | degree          |                                  |
| phone                   | phone           |                                  |
| email                   | email           |                                  |
| doctorType              | doctor_type     |                                  |
| gender                  | gender          |                                  |
| dob                     | dob             |                                  |
| age                     | age             |                                  |
| userId                  | user_id         |                                  |
| doctorTemplateIds       | doctor_template | many2many                        |

**Note:** partnerName is text; the API finds-or-creates the matching res.partner and returns partnerId.

# 4. Technicians

**React file:** src/pages/technicians/TechnicianList.jsx, src/pages/technicians/TechnicianForm.jsx

**Odoo model:** technician

<table>
<colgroup>
<col style="width: 50%" />
<col style="width: 50%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Odoo model</strong></th>
<th><strong>Endpoints</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>technician</td>
<td>GET /api/ris/technicians<br />
GET /api/ris/technicians/&lt;id&gt;<br />
POST /api/ris/technicians<br />
PUT /api/ris/technicians/&lt;id&gt;<br />
DELETE /api/ris/technicians/&lt;id&gt;</td>
</tr>
</tbody>
</table>

| **React field**         | **Odoo field** | **Read-only**    |
|-------------------------|----------------|------------------|
| partnerName / partnerId | partner_id     | resolved by name |
| specialization          | specialization |                  |
| degree                  | degree         |                  |
| phone                   | phone          |                  |
| email                   | email          |                  |
| gender                  | gender         |                  |
| dob                     | dob            |                  |
| age                     | age            |                  |

# 5. Document Templates

**React file:** src/pages/documentTemplates/DocumentTemplateList.jsx, DocumentTemplateForm.jsx

**Odoo model:** document.template

<table>
<colgroup>
<col style="width: 50%" />
<col style="width: 50%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Odoo model</strong></th>
<th><strong>Endpoints</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>document.template</td>
<td>GET /api/ris/documentTemplates<br />
GET /api/ris/documentTemplates/&lt;id&gt;<br />
POST /api/ris/documentTemplates<br />
PUT /api/ris/documentTemplates/&lt;id&gt;<br />
DELETE /api/ris/documentTemplates/&lt;id&gt;<br />
GET/POST /api/ris/documentTemplates/&lt;id&gt;/binary/file (the actual file upload/download)</td>
</tr>
</tbody>
</table>

| **React field** | **Odoo field** | **Read-only**  |
|-----------------|----------------|----------------|
| name            | name           |                |
| fileName        | file_name      |                |
| fileType        | file_type      | yes (computed) |
| description     | description    |                |
| active          | active         |                |
| userId          | user_id        |                |

# 6. Appointments (booking form + list + scheduler)

**React file:** src/pages/appointments/AppointmentList.jsx (list)

**React file:** src/pages/appointments/AppointmentForm.jsx (create/edit form)

**React file:** src/pages/appointments/RisScheduler.jsx (day/week calendar)

**React file:** src/pages/appointments/PatientIdCard.jsx (ID card scan strip, inside AppointmentForm)

**React file:** src/pages/appointments/BasketTables.jsx (consumable + extra items, inside AppointmentForm)

**Odoo model:** ris.management (+ basket.table, basket.extra.table for the nested lines)

<table>
<colgroup>
<col style="width: 50%" />
<col style="width: 50%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Purpose</strong></th>
<th><strong>Endpoints</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>List / load / save / delete</td>
<td>GET /api/ris/managements<br />
GET /api/ris/managements/&lt;id&gt;<br />
POST /api/ris/managements<br />
PUT /api/ris/managements/&lt;id&gt;<br />
DELETE /api/ris/managements/&lt;id&gt;</td>
</tr>
<tr class="even">
<td>Patient picked -&gt; autofill</td>
<td>GET /api/ris/managements/onchange/patient/&lt;patientId&gt;</td>
</tr>
<tr class="odd">
<td>Procedure picked -&gt; price/category</td>
<td>GET /api/ris/managements/onchange/product/&lt;productId&gt;[?planId=]</td>
</tr>
<tr class="even">
<td>Calendar events (RisScheduler.jsx)</td>
<td>GET /api/ris/managements/events?dateFrom=&amp;dateTo=&amp;states=&amp;categoryIds=</td>
</tr>
<tr class="odd">
<td>Drag-to-reschedule</td>
<td>POST /api/ris/managements/&lt;id&gt;/reschedule</td>
</tr>
<tr class="even">
<td>ID card OCR (PatientIdCard.jsx "Manual Extract")</td>
<td>POST /api/ris/managements/&lt;id&gt;/extract</td>
</tr>
<tr class="odd">
<td>ID card image upload/download</td>
<td>GET/POST /api/ris/managements/&lt;id&gt;/binary/card</td>
</tr>
<tr class="even">
<td>Basket "Done All" / "Return All" (BasketTables.jsx)</td>
<td>POST /api/ris/managements/&lt;id&gt;/basket/done_all<br />
POST .../basket/return_all<br />
POST .../basket/done_all_extra<br />
POST .../basket/return_all_extra</td>
</tr>
<tr class="odd">
<td>"+ Add Procedure"</td>
<td>POST /api/ris/managements/&lt;id&gt;/procedures<br />
DELETE .../procedures/&lt;childId&gt;</td>
</tr>
<tr class="even">
<td>Print Invoice / Job Order / Label</td>
<td>GET /api/ris/managements/&lt;id&gt;/print/invoice|job_order|sticker</td>
</tr>
</tbody>
</table>

## Top-level fields — ris.management

| **React field**                                                           | **Odoo field**                                    | **Read-only**                 |
|---------------------------------------------------------------------------|---------------------------------------------------|-------------------------------|
| patientId                                                                 | patient                                           |                               |
| natId                                                                     | nat_id                                            |                               |
| passportNumber                                                            | passport_number                                   |                               |
| dob                                                                       | dob                                               |                               |
| age                                                                       | age                                               | yes                           |
| gender                                                                    | gender                                            |                               |
| phone                                                                     | phone                                             |                               |
| address                                                                   | address                                           |                               |
| landline                                                                  | landline                                          |                               |
| foreigner                                                                 | foreigner                                         |                               |
| patientState                                                              | patient_state                                     |                               |
| patientType                                                               | patient_type                                      |                               |
| contractId                                                                | contract                                          |                               |
| plansId                                                                   | plans                                             |                               |
| pricelistId                                                               | pricelist_id                                      |                               |
| insurancePlanLineId                                                       | insurance_plan_line_id                            |                               |
| examReason                                                                | exam_reason                                       |                               |
| medicalInfo                                                               | medical_info                                      |                               |
| description                                                               | description                                       |                               |
| otherComments                                                             | other_comments                                    |                               |
| weight / height / temperature / bloodSugar / bloodPressure                | same names                                        |                               |
| examDate                                                                  | exam_date                                         |                               |
| stateOfExamSelection                                                      | state_of_exam_selection                           |                               |
| categoryId                                                                | category_id                                       |                               |
| cashProductId                                                             | cash_product_id                                   |                               |
| bodyPartModelId                                                           | body_part_model                                   |                               |
| machineId                                                                 | machine_id                                        |                               |
| doctorId                                                                  | doctor                                            |                               |
| technicianId                                                              | technician                                        |                               |
| patientCondition                                                          | patient_condition                                 |                               |
| accession                                                                 | accession                                         | yes                           |
| createUid                                                                 | create_uid                                        | yes                           |
| basketLocationId                                                          | basket_location_id                                |                               |
| singleAmountFromGeneral / singleDiscountAmount / singleDiscountPercentage | same names                                        |                               |
| companyShare / patientShare                                               | same names                                        |                               |
| discountReason1Id                                                         | discount_reason_1                                 |                               |
| generalAmountDiscount / generalPercentageDiscount                         | same names                                        |                               |
| totalRecordAmountDiscount                                                 | total_record_amount_discount                      |                               |
| cash                                                                      | cash                                              |                               |
| cashReceipt                                                               | cash_receipt                                      | yes                           |
| examPrice / totalAmountAfterAll / remaining / extraItemsAmount            | same names                                        | yes                           |
| state                                                                     | state                                             |                               |
| state2                                                                    | state2                                            |                               |
| durationDisplay / totalDurationDisplay                                    | same names                                        | yes                           |
| linkedProcedures                                                          | ris_track_service (child records)                 | yes, see procedures endpoints |
| consumableServiceIds                                                      | consumable_service_ids (basket.table)             | array, see below              |
| extraServiceIds                                                           | extra_consumable_service_ids (basket.extra.table) | array, see below              |
| cardImageName                                                             | card (binary)                                     | yes, see binary endpoint      |

## consumableServiceIds line fields — basket.table

| **React field** | **Odoo field** | **Read-only** |
|-----------------|----------------|---------------|
| sequence_      | sequence_     | yes           |
| productId       | product_id     |               |
| uomId           | uom_id         |               |
| barcode         | barcode        |               |
| price           | price          |               |
| plannedQty      | planned_qty    |               |
| actualQty       | actual_qty     |               |
| returnedQty     | returned_qty   |               |
| availableQty    | available_qty  | yes           |
| totalPrice      | total_price    | yes           |
| notes           | notes          |               |
| isDone          | is_done        |               |

## extraServiceIds line fields — basket.extra.table

| **React field** | **Odoo field**   | **Read-only** |
|-----------------|------------------|---------------|
| productId       | product_id       |               |
| uomId           | uom_id           |               |
| price           | price            |               |
| extraAmount     | extra_amount     |               |
| returnedQty     | returned_qty     |               |
| availableQty    | available_qty    | yes           |
| extraItemPrice  | extra_item_price | yes           |
| totalPrice      | total_price      | yes           |
| isDone          | is_done          |               |

# 7. WorkList (management) — separate screen, same model

**React file:** src/pages/management/ManagementList.jsx (list)

**React file:** src/pages/management/ManagementForm.jsx (edit form + Pay/Report buttons)

**React file:** src/pages/management/WorkListCalendar.jsx (calendar view)

**React file:** src/pages/management/ConsumableServiceTable.jsx (consumable lines, inside ManagementForm)

**React file:** src/pages/management/ReportViewerModal.jsx (report popup, used by both List and Form)

**Odoo model:** ris.management (same model/fields as Section 6)

<table>
<colgroup>
<col style="width: 50%" />
<col style="width: 50%" />
</colgroup>
<thead>
<tr class="header">
<th><strong>Purpose</strong></th>
<th><strong>Endpoints</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>List / load / save / delete</td>
<td>same CRUD routes as Section 6: /api/ris/managements[...]</td>
</tr>
<tr class="even">
<td>Calendar events (WorkListCalendar.jsx)</td>
<td>GET /api/ris/managements/events?...</td>
</tr>
<tr class="odd">
<td>Consumable lines (ConsumableServiceTable.jsx)</td>
<td>part of PUT /api/ris/managements/&lt;id&gt; body: consumableServiceIds</td>
</tr>
<tr class="even">
<td>"Pay" button</td>
<td>GET /api/ris/payment-ways<br />
POST /api/ris/managements/&lt;id&gt;/pay</td>
</tr>
<tr class="odd">
<td>Report popup buttons (ReportViewerModal.jsx: Partial / Not Verified / Verify)</td>
<td>POST /api/ris/managements/&lt;id&gt;/report/partial|not_verified|verify</td>
</tr>
<tr class="even">
<td>"Save Summary"</td>
<td>PUT /api/ris/managements/&lt;id&gt;/report/summary</td>
</tr>
<tr class="odd">
<td>"Save Report" (form footer)</td>
<td>POST /api/ris/managements/&lt;id&gt;/report/save-pdf</td>
</tr>
<tr class="even">
<td>"Verify Report" (form footer)</td>
<td>POST /api/ris/managements/&lt;id&gt;/report/verify</td>
</tr>
<tr class="odd">
<td>Cancel booking</td>
<td>POST /api/ris/managements/&lt;id&gt;/cancel</td>
</tr>
<tr class="even">
<td>Apply document template</td>
<td>GET /api/ris/managements/&lt;id&gt;/templates<br />
POST .../apply-template/&lt;templateId&gt;</td>
</tr>
<tr class="odd">
<td>Report file binary (Report File field)</td>
<td>GET/POST /api/ris/managements/&lt;id&gt;/binary/card (image) — report PDF via /report/pdf</td>
</tr>
</tbody>
</table>