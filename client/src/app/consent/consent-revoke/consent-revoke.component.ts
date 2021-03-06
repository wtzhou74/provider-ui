import {Component, OnInit} from '@angular/core';
import {Consent} from "../shared/consent.model";
import {AuthenticationService} from "../../security/shared/authentication.service";
import {UtilityService} from "../../shared/utility.service";
import {ConsentService} from "../shared/consent.service";
import {NotificationService} from "../../shared/notification.service";
import {TokenService} from "../../security/shared/token.service";
import {Patient} from "../../patient/shared/patient.model";
import {ConsentRevocation} from "../shared/consent-revocation.model";
import {BinaryFile} from "../../shared/binary-file.model";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'c2s-consent-revoke',
  templateUrl: './consent-revoke.component.html',
  styleUrls: ['./consent-revoke.component.scss']
})
export class ConsentRevokeComponent implements OnInit {
  public title: string = "Revoke Consent";
  public checked: boolean = false;
  public isAuthenticated: boolean = false;
  public password: string;
  public inValid: boolean;
  public consent: Consent;
  consentRevocationTerms: string;
  private userName: string;
  fullName: string;
  consentId: string;
  username: any;
  public selectedPatientName: any;
  public selectedPatient: Patient;
  private consentListUrl: string;

  constructor(private authenticationService: AuthenticationService,
              private route: ActivatedRoute,
              private tokenService: TokenService,
              private consentService: ConsentService,
              private utilityService: UtilityService,
              private notificationService: NotificationService) {
  }

  ngOnInit() {
    this.selectedPatient = this.route.snapshot.parent.data['patient'];
    this.consentListUrl = "/patients".concat("/" + this.selectedPatient.id);
    let fullName: string = this.utilityService.getFullName(this.selectedPatient);
    this.selectedPatientName = {name: fullName};

    this.route.params.subscribe(params => {
      if (params['consentId']) {
        this.consent = this.route.snapshot.data['consent'];
      }
    });

    this.route.params.subscribe(params => {
      if (params['consentId']) {
        this.consentId = params['consentId'];
      }
    });

    this.consentRevocationTerms = this.route.snapshot.data['consentRevocationTerms'].text;
    let profile = this.tokenService.getProfileToken();
    this.userName = profile.userName;
    let userNameFromProfile = this.utilityService.toTitleCase(profile.name);
    this.username = {name: userNameFromProfile};
  }

  public clearCheckbox() {
    if (this.isAuthenticated != true) {
      this.checked = false;
      this.inValid = false;
    }
  }

  public toAuthenticate(dialog: any) {
    this.authenticationService.login(this.userName, this.password)
      .subscribe(
        () => {
          this.inValid = false;
          this.isAuthenticated = true;
          dialog.close();
        },
        error => {
          this.inValid = true;
          this.password = null;
        }
      );
  }

  public revokeConsent(dialog: any) {
    let consentRevocation = new ConsentRevocation(true);
    this.consentService.revokeConsent(consentRevocation, this.selectedPatient.mrn, this.consent.id).subscribe(
      () => {
        dialog.open();
      },
      err => {
        this.notificationService.i18nShow("CONSENT.NOTIFICATION_MSG.FAILED_REVOKE_CONSENT");
      }
    )
  }

  public navigateTo() {
    this.utilityService.navigateTo(this.consentListUrl);
  }

  public cancel(): void {
    this.utilityService.navigateTo(this.consentListUrl);
  }

  public downloadRevokedConsent(): void {
    this.consentService.getRevokedConsentPdf(this.selectedPatient.mrn, parseInt(this.consentId))
      .subscribe(
        (revokedPdf: BinaryFile) => this.onSuccess(revokedPdf, "Revoked_consent"),
        (error: any) => this.onError);
  }

  private onSuccess(revokedPdf: BinaryFile, prefix: string) {
    this.utilityService.downloadFile(revokedPdf.content, `${prefix}_${this.consentId}.pdf`, revokedPdf.contentType);
    this.notificationService.i18nShow("CONSENT.NOTIFICATION_MSG.SUCCESS_DOWNLOAD_REVOKED_CONSENT");
  }

  private onError(error: any) {
    this.notificationService.i18nShow("CONSENT.NOTIFICATION_MSG.FAILED_DOWNLOAD_REVOKED_CONSENT");
  }
}

