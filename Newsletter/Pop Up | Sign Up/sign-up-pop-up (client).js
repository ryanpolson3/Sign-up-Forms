(function() {

   /* ==========================================================================
       Pop Up Template Functions
   ========================================================================== */
   const pageExitMillis = 0;

   /**
    * @function buildBindId
    * @param {Object} context
    * @description Create unique bind ID based on the campaign and experience IDs.
    */
   function buildBindId(context) {
       return `${context.campaign}:${context.experience}`;
   }

   /**
    * @function setConfirmationPanel
    * @description Add click listener to the Call-To-Action button that validates the user email address,
    * shows the Confirmation Panel, removes dismissal tracking from the "X" button and overlay, and sends
    * an event to Interaction Studio to set the emailAddress attribute to the user email address.
    */
   // function setConfirmationPanel() {
   //     SalesforceInteractions.cashDom("#evg-exit-intent-popup-email-capture .evg-cta").on("click", () => {
   //         const emailAddress = SalesforceInteractions.cashDom(".evg-form input[placeholder='Email']").val();
   //         const regex = RegExp(/^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]+)$/);
   //         if (emailAddress && regex.test(emailAddress)) {
   //             SalesforceInteractions.cashDom("#evg-exit-intent-popup-email-capture .evg-main-panel").addClass("evg-hide");
   //             SalesforceInteractions.cashDom("#evg-exit-intent-popup-email-capture .evg-confirm-panel").removeClass("evg-hide");
   //             SalesforceInteractions.cashDom(`
   //                 #evg-exit-intent-popup-email-capture .evg-overlay,
   //                 #evg-exit-intent-popup-email-capture .evg-btn-dismissal
   //             `).removeAttr("data-evg-dismissal");
   //             SalesforceInteractions.sendEvent({
   //                 interaction: {
   //                     name: "Exit Intent Email Capture"
   //                 },
   //                 user: {
   //                     attributes: {
   //                         emailAddress: emailAddress
   //                     }
   //                 }
   //             });
   //         } else {
   //             SalesforceInteractions.cashDom("#evg-exit-intent-popup-email-capture .evg-error-msg")
   //                 .removeClass("evg-hide")
   //                 .addClass("evg-error");
   //         }
   //     });
   // }

   /**
    * @function setDismissal
    * @param {Object} context
    * @description Add click listener to the overlay, "X" button, and opt-out text that removes the
    * template from the DOM.
    */
   function setDismissal(context) {
       const dismissSelectors = `
           #evg-exit-intent-popup-email-capture .evg-overlay,
           #evg-exit-intent-popup-email-capture .evg-btn-dismissal,
           #evg-exit-intent-popup-email-capture .evg-opt-out-msg,
           #evg-exit-intent-popup-email-capture .evg-close
       `;

       SalesforceInteractions.cashDom(dismissSelectors).on("click", () => {
           SalesforceInteractions.cashDom("#evg-exit-intent-popup-email-capture").remove();
       });
   }

   function apply(context, template) {
      console.log('Apply Fired!');
      if (!context.contentZone) return;

      /**
       * The pageExit method waits for the user's cursor to exit through the top edge of the page before rendering the
       * template after a set delay.
       *
       * Visit the Template Display Utilities documentation to learn more:
       * https://developer.evergage.com/campaign-development/web-templates/web-display-utilities
       */
      return SalesforceInteractions.DisplayUtils
      .bind(buildBindId(context))
      //.pageExit(pageExitMillis)
      .pageInactive(500)
      .then(() => {
         console.log('Pop Up Fired!');
         const html = template(context);
         SalesforceInteractions.cashDom("body").append(html);
         // setConfirmationPanel();
         setDismissal(context);
         disable();
         validateEmail();
         
         /* ==========================================================================
            Hidden Attributes
         ========================================================================== */
         var channel = window.sinclairDigital.facade.rendering.site.callLetters;
         document.getElementById('channel').value = channel;
         
         // console.log('Channel Call Letters: ' + channel);
         // console.log('Channel Input Value: ' + document.getElementById('channel').value);

         /* ==========================================================================
            Display Input Labels
         ========================================================================== */
         document.querySelectorAll("input[type='text']").forEach(function(input) {
            input.addEventListener('input', function(e) {
               if (this.value) {
                  this.parentNode.querySelector("label").classList.remove("evg-dispay_none");
                  this.parentNode.querySelector("label").classList.add("evg-visibility_show");
               } else {
                  this.parentNode.querySelector("label").classList.remove("evg-visibility_show");
               }
            });
         });

         document.getElementById('evg-newsletterSignUp').addEventListener('submit', function(e) {
            console.log('Submitted');
            e.preventDefault();
            // sendToUDL({

            //    event: 'newsletter_signup_complete'
            
            // });
      
            /* ==========================================================================
               Checkboxes
            ========================================================================== */
            //const button = document.getElementById('evg-sign_up');
      
            if (document.getElementById('evg-daily_newsletter').checked) {
               document.getElementById("evg-dailyNewsletter_consent").value = "opt-in";
               console.log('Daily News: ' + document.getElementById("evg-dailyNewsletter_consent").value);
            } else {
               document.getElementById("evg-dailyNewsletter_consent").value = 'opt-out';
               console.log('Daily News: ' + document.getElementById("evg-dailyNewsletter_consent").value);
            }

            if (document.getElementById('evg-weather_newsletter').checked) {
               document.getElementById("evg-weatherNewsletter_consent").value = 'opt-in';
               console.log('Weather: ' + document.getElementById("evg-weatherNewsletter_consent").value);
            } else {
               document.getElementById("evg-weatherNewsletter_consent").value = 'opt-out';
               console.log('Weather: ' + document.getElementById("evg-weatherNewsletter_consent").value);
            }
      
            if (document.getElementById('evg-emailConsent').checked) {
               document.getElementById("evg-marketing_consent").value = 'opt-in';
               console.log('Marketing: ' + document.getElementById("evg-marketing_consent").value);
            } else {
               document.getElementById("evg-marketing_consent").value = 'opt-out';
               console.log('Marketing: ' + document.getElementById("evg-marketing_consent").value);
            }

            var data = new FormData(this);
            for (var pair of data.entries()) {
               console.log(pair[0] + ": " + pair[1]);
            }
      
            /* ==========================================================================
               Show Loading Spinner 
            ========================================================================== */
            // document.getElementById('evg-loading').classList.remove("evg-hide");
      
            /* ==========================================================================
               Email Check
            ========================================================================== */
            var emailInput = this.querySelector("input[name='email']");
            var form_error_el = this.querySelector("div[id='evg-form_input_error']");
            
            if (emailInput.value.length === 0) {
               // Error Message: Email address required
               emailInput.classList.add("evg-form_input_error");
               this.querySelector("label[id='evg-label_email']").classList.add("evg-form_label_error");
               form_error_el.classList.remove("evg-hide");
               form_error_el.textContent = 'Email address is required';
               document.getElementById('evg-loading').classList.add("evg-hide");
            } else if (!validateEmail(emailInput.value)) {
               // Error Message: Email address is invalid
               emailInput.classList.add("evg-form_input_error");
               this.querySelector("label[id='evg-label_email']").classList.add("evg-form_label_error");
               form_error_el.classList.remove("evg-hide");
               form_error_el.textContent = 'Email address is invalid';
               document.getElementById('evg-loading').classList.add("evg-hide");
            } else {
               // Successful Validation: Remove all error messages and states
               emailInput.classList.remove("evg-form_input_error");
               this.querySelector("label[id='evg-label_email']").classList.remove("evg-form_label_error");
               form_error_el.classList.add("evg-hide");
               form_error_el.textContent = '';

               // Run AJAX
               var xhr = new XMLHttpRequest();
               xhr.open('POST', 'https://mcscy3hz7znv60v-895pbhg46h81.pub.sfmc-content.com/w0hagws2x4r');
               xhr.onload = function() {
                  if (xhr.status === 200) {
                     // Request was successful, handle the response here
                     processJSONPResponse(xhr.responseText);
                     console.log('response: ' + response);
                  } else {
                     // Request failed, handle the error here
                     console.error("Request failed with status:", xhr.status);
                  }
               };
               xhr.send(data);

               // Hide Form | Display Thank You Message
               document.getElementById('evg-hero_img').style.display = "none";
               document.getElementById('evg-h1').style.display = "none";
               document.getElementById('evg-newsletterSignUp').style.display = "none";
               document.getElementById('evg-opt-out-msg').style.display = "none";
               document.getElementById('evg-thxlayout').style.display = "block";
            }
         });
      })
      
   };

   function reset(context, template) {
       SalesforceInteractions.DisplayUtils.unbind(buildBindId(context));
       SalesforceInteractions.cashDom("#evg-exit-intent-popup-email-capture").remove();
   }

   function control(context) {
       return SalesforceInteractions.DisplayUtils
           .bind(buildBindId(context))
           .pageExit(pageExitMillis)
           .then(() => {
               if (context.contentZone) return true;
           });
   }

   registerTemplate({
       apply: apply,
       reset: reset,
       control: control
   });

   /* ==========================================================================
       Function Disable Sign Up Button Unless Checkbox Is Checked
   ========================================================================== */
   function disable() {
       const button = document.getElementById('evg-sign_up');
       const form_input_checkbox_error = document.getElementById('evg-form_input_checkbox_error');
       button.disabled = true;
       
       document.getElementById('evg-emailConsent').addEventListener('change', function(e) {
           if (this.checked) {
               button.disabled = false;
               form_input_checkbox_error.classList.add('evg-hide');
           } else {
               button.disabled = true;
               form_input_checkbox_error.classList.remove('evg-hide');
               form_input_checkbox_error.textContent = 'You must agree to the terms and conditions and the privacy policy in order to sign up to our newsletters';
           }
       });
   }

   /* ==========================================================================
       Function Validate Email Address
   ========================================================================== */
   function validateEmail(email) {
       var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
       return re.test(String(email).toLowerCase());
   }

    /* ==========================================================================
       Function Send To UDL
    ========================================================================== */
   //  var sendToUDL = function (dLdata) {
   //      try {
   //          var postObject = JSON.stringify({
   //              event: 'newsletter_signup_complete'
   //          });
   //          parent.postMessage(postObject, '*');
   //      } catch (e) {
   //          window.console && window.console.log(e);
   //      }
   //  };

   /* ==========================================================================
       Function Hides Form & Displays Thank You Message
   ========================================================================== */
   function processJSONPResponse(response) {
      //  document.getElementById('evg-loading').classList.add("evg-hide");
      //  document.getElementById('evg-thxlayout').style.display = "block";
      //  document.getElementById('evg-h1').style.display = "none";
      //  document.getElementById('evg-newsletterSignUp').style.display = "none";
   }
   
   

})();