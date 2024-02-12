   %%[ 
   SET @fname = QueryParameter("fname") 
   SET @lname = QueryParameter("lname") 
   SET @email = QueryParameter("email") 
   SET @channel = QueryParameter("channel") 
   SET @ip = QueryParameter("ip") 
   SET @lifeStyle = QueryParameter("lifeStyle")
   SET @browser = QueryParameter("broswer")
   SET @source = QueryParameter("source")
   SET @dailyNewsletter_consent = QueryParameter("dailyNewsletter_consent")
   SET @weatherNewsletter_consent = QueryParameter("weatherNewsletter_consent")
   SET @marketing_consent = QueryParameter("marketing_consent")
   ]%%
   
   
   <script runat="server">
      Platform.Load("core","1.1.5");
      var eventPayload = "";
      var prox = new Script.Util.WSProxy();
      Variable.SetValue("@callID", Platform.Function.GUID());
      function logger(options)
      {
         /*options.thisDetail.thisJobID = Variable.GetValue("@jobid");
         options.thisDetail.jobSubscriberKey = Variable.GetValue("@subkey");
         options.thisDetail.emailaddr = Variable.GetValue("@emailaddr");          
         options.thisDetail.emailName = Variable.GetValue("@emailName");         
         options.thisDetail.publishVersion = 1; */
         
         return Platform.Function.InsertData("Newsletter_SingUp_Audit", ["CallID","Message","SubscriberKey","Details"], [Variable.GetValue("@callID"),options.thisMessage,Variable.GetValue("@subkey"),Stringify(options.thisDetail)] );
      }

      var api_key = Platform.Function.Lookup('Salesforce_Integration_Lookup','CharValue','Key','UUID_API_KEY_PROD');
   
      var api_url = Platform.Function.Lookup('Salesforce_Integration_Lookup','CharValue','Key','UUID_API_URL_PROD');
   
      var lifeStyle = Variable.GetValue("@lifeStyle");
      var emailID = Variable.GetValue("@email");
      var fname = Variable.GetValue("@fname");
      var lname = Variable.GetValue("@lname");
      var channel = Variable.GetValue("@channel");
      /*if (channel == 'WLUK_Lifestyle') {
         var channel = 'WLUK';
         var lifeStyle = true;
      }*/
      var ip = Variable.GetValue("@ip");
      var browser = Variable.GetValue("@browser");
      var uuidreq = new Script.Util.HttpRequest(api_url);
      var source = Variable.GetValue("@source");
      var property_id = Platform.Function.Lookup('Master Data - MID - ORGID','organization_id','Call_Sign',channel);
      var brand_de = Platform.Function.Lookup('Master Data - MID - ORGID','Master_Data_Name','Call_Sign',channel);
      var dailyNewsletter_consent = Variable.GetValue("@dailyNewsletter_consent")
      var weatherNewsletter_consent = Variable.GetValue("@weatherNewsletter_consent")
      var marketing_consent = Variable.GetValue("@marketing_consent")
      uuidreq.continueOnError = true;
      uuidreq.contentType = "application/json";
      uuidreq.method = "POST";
      uuidreq.setHeader("x-api-key",api_key);
      uuidreq.setHeader("User-Agent","Salesforce");
      if(source == 'Footer sign-up'){
         var uuidPayload = '{"email_address": "'+emailID+'","PROPERTY_ID": "'+property_id+'","OPT_IN": "true", "STATION_ID": "'+channel+'"}';
      }
      else {
         var uuidPayload = '{"FIRST_NAME": "'+fname+'","LAST_NAME":"'+lname+'", "email_address": "'+emailID+'","PROPERTY_ID": "'+property_id+'","OPT_IN": "true", "STATION_ID": "'+channel+'"}'; 
      }
      uuidreq.postData = uuidPayload;
      var uuidResponse = uuidreq.send();
      if(uuidResponse.statusCode == 200){
         var uuidResponse_json = Platform.Function.ParseJSON(String(uuidResponse.content));
         var uuid = uuidResponse_json.user_uuid;
         Variable.SetValue("@uuid",uuid);
      }
      
      logger({thisMessage:source+" Processing Page",thisDetail:{callId:Variable.GetValue("@callID"),postbody:Platform.Request.GetPostData(),user_uuid:uuid,master_de:"ENT."+brand_de}});
      
      var access_token = Platform.Function.Lookup('Salesforce_Integration_Lookup','CharValue','Key','SFMC_ACCESS_TOKEN');
   
      var event_url = Platform.Function.Lookup('Salesforce_Integration_Lookup','CharValue','Key','SFMC_JOURNEY_EVENT_URL_PROD');
      
      var Bearer = "Bearer " + access_token;
      
      if(brand_de != ''){
         
         logger({thisMessage:"Processing Page Master",thisDetail:{callId:Variable.GetValue("@callID"),postbody:Platform.Request.GetPostData(),user_uuid:uuid,email_address:emailID,master_de:"ENT."+brand_de,response:response}});
         try{
            
            var masterDE = DataExtension.Init("ENT."+brand_de);
            var response = Platform.Function.UpsertData("ENT."+brand_de, ["user_uuid"],[uuid],["email_address","pref_unsubscribe"],[emailID,false]);
         /*masterDE.Rows.Update({user_uuid:uuid}, ["email_address","modified_date"], [emailID],NOW());*/
            
            logger({thisMessage:"Processing Page Master",thisDetail:{callId:Variable.GetValue("@callID"),postbody:Platform.Request.GetPostData(),user_uuid:uuid,email_address:emailID,master_de:"ENT."+brand_de,response:response}});
            
         }
         catch(e){
            logger({thisMessage:"Processing Page Master Error",thisDetail:{callId:Variable.GetValue("@callID"),postbody:Platform.Request.GetPostData(),user_uuid:uuid,error:Stringify(e)}});
         }
         
      }
   
      try{ 
      if(source == 'Footer sign-up'){
         
         Platform.Function.UpsertData("DIM_USER", ["user_uuid"],[uuid],["email_address","modified_date"],[emailID,Now()]);
         
         eventPayload = '{"ContactKey":"'+uuid+'","EventDefinitionKey":"Daily_Newsletter_Singup","Data":{"uuid":"'+uuid+'","email_address":"'+emailID+'","channel":"'+channel+'","property_id":"'+property_id+'","dailyNewsletter_consent":"'+dailyNewsletter_consent+'","weatherNewsletter_consent":"'+weatherNewsletter_consent+'","marketing_consent":"'+marketing_consent+'","ip":"'+ip+'","source":"'+source+'"}}';
         
      }
      else {
         Platform.Function.UpsertData("DIM_USER", ["user_uuid"],[uuid],["email_address","first_name","last_name","modified_date"],[emailID,fname,lname,Now()]);
         
         eventPayload = '{"ContactKey":"'+uuid+'","EventDefinitionKey":"Daily_Newsletter_Singup","Data":{"uuid":"'+uuid+'","email_address":"'+emailID+'","first_name":"'+fname+'","last_name":"'+lname+'","channel":"'+channel+'","property_id":"'+property_id+'","dailyNewsletter_consent":"'+dailyNewsletter_consent+'","weatherNewsletter_consent":"'+weatherNewsletter_consent+'","marketing_consent":"'+marketing_consent+'","ip":"'+ip+'","source":"'+source+'","lifeStyle":"'+lifeStyle+'"}}';
      }
      }
      catch(e){
         logger({thisMessage:source+"Processing Page DIM_User Error",thisDetail:{callId:Variable.GetValue("@callID"),postbody:Platform.Request.GetPostData(),user_uuid:uuid,error:Stringify(e)}});
      }   
         
         logger({thisMessage:"Processing Page",thisDetail:{callId:Variable.GetValue("@callID"),postbody:Platform.Request.GetPostData(),channel:channel,lifeStyle:lifeStyle}});
      if(dailyNewsletter_consent == 'opt-in' && (lifeStyle == 'false' || lifeStyle == '' || lifeStyle == 'False') && channel != 'Tennis'){
         
         logger({thisMessage:"All channel daily",thisDetail:{callId:Variable.GetValue("@callID"),user_uuid:uuid,channel:channel,lifeStyle:lifeStyle,property_id:property_id}});
         
         Platform.Function.UpsertData("FACT_OPTIN_CLEAN", ["user_uuid","optin_id","property_id"],[uuid,309267,property_id],["group_id","sending_status","status","modified_date"],[2792,"New - No activity yet","Active",Now()]);
      }
   
      if(dailyNewsletter_consent == 'opt-in' && (lifeStyle == 'false' || lifeStyle == '' || lifeStyle == 'False') && channel == 'Tennis'){
         
         logger({thisMessage:"Tennis news upsert",thisDetail:{callId:Variable.GetValue("@callID"),user_uuid:uuid,channel:channel,lifeStyle:lifeStyle}});
         
         Platform.Function.UpsertData("FACT_OPTIN_CLEAN", ["user_uuid","optin_id","property_id"],[uuid,340678,property_id],["group_id","sending_status","status","modified_date"],[2792,"New - No activity yet","Active",Now()]);
      }
      
      if(weatherNewsletter_consent == 'opt-in' &&  (lifeStyle == 'false' || lifeStyle == '' || lifeStyle == 'False')){
         
         logger({thisMessage:"weather upsert",thisDetail:{callId:Variable.GetValue("@callID"),user_uuid:uuid,channel:channel,lifeStyle:lifeStyle}});
         
         Platform.Function.UpsertData("FACT_OPTIN_CLEAN", ["user_uuid","optin_id","property_id"],[uuid,309269,property_id],["group_id","sending_status","status","modified_date"],[2792,"New - No activity yet","Active",Now()]);
      }
   
      if(marketing_consent == 'opt-in'){
         
         logger({thisMessage:"Marketing upsert",thisDetail:{callId:Variable.GetValue("@callID"),user_uuid:uuid,channel:channel,lifeStyle:lifeStyle}});
         
      Platform.Function.UpsertData("FACT_OPTIN_CLEAN", ["user_uuid","optin_id","property_id"],[uuid,594,property_id],["group_id","sending_status","status","modified_date"],[2792,"New - No activity yet","Active",Now()]);
         
      } 
      
      if(lifeStyle == 'True' && dailyNewsletter_consent == 'opt-in'){
         
         logger({thisMessage:"Lifestyle upsert",thisDetail:{callId:Variable.GetValue("@callID"),user_uuid:uuid,channel:channel,lifeStyle:lifeStyle}});
         
         Platform.Function.UpsertData("LifeStyle_OptIn", ["user_uuid","optin_id","property_id"],[uuid,309267,property_id],["group_id","sending_status","status","modified_date"],[2792,"New - No activity yet","Active",Now()]);
      }
      
         logger({thisMessage:"Email Event Call",thisDetail:{callId:Variable.GetValue("@callID"),user_uuid:uuid,channel:channel,eventPayload:eventPayload}});
      
      var eventReq = new Script.Util.HttpRequest(event_url);
      eventReq.continueOnError = true;
      eventReq.contentType = "application/json";
      eventReq.method = "POST";
      eventReq.setHeader("Authorization",Bearer);
      eventReq.postData = eventPayload;
      var eventResponse = eventReq.send();
      var eventResponseCode = eventResponse.statusCode;
      Variable.SetValue("@eventResponseCode",eventResponseCode);
      Variable.SetValue("@payload",eventPayload);
      Variable.SetValue("@token",Bearer);
      
      logger({thisMessage:"Email Event Call",thisDetail:{callId:Variable.GetValue("@callID"),user_uuid:uuid,channel:channel,eventResponseCode:eventResponseCode}});
      
      }
      
   </script>
   %%[IF @eventResponseCode == 201 THEN ]%%processJSONPResponse({"status":"Success"})%%[ ELSE ]%%processJSONPResponse({"status":"Error"})%%[ ENDIF ]%%
   