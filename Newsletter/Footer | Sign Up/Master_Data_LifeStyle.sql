SELECT 
   DU.user_uuid,
   DU.email_address,
   DU.first_name,
   DU.last_name,
   DU.zipcode, 
   DU.gender,
   DU.address1,
   DU.address2,
   DU.city,
   DU.state,
   DU.date_of_birth,
   DU.phone_number,
   DU.sending_status,
   DU.modified_date,
   DU.user_id,
   FOC.source_app_id, case 
      when FOC.status = 'Active' then 'True' 
      when FOC.status = 'Inactive' then 'False'
   end as lifestyle

FROM DIM_USER AS DU

JOIN LifeStyle_OptIn AS FOC ON DU.user_uuid = FOC.user_uuid
JOIN DIM_ORGANIZATION AS DO ON FOC.property_id = DO.organization_id
JOIN [Master Data - MID - ORGID] AS MMO ON DO.organization_id = MMO.organization_id

WHERE 
   MMO.MID = 514029666
   AND FOC.optin_id = 309267 