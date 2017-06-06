import { Component, EventEmitter, OnInit, ViewChild } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {UploadOutput, UploadInput, UploadFile, humanizeBytes} from 'ngx-uploader';


import {TokenService} from "../../security/shared/token.service";
import {UploadOutputType} from "../shared/upload-output-type.enum";
import {SegmentationRequest} from "../shared/segmentation-request";
import {ConsentService} from "../shared/consent.service";

@Component({
  selector: 'c2s-segmentation',
  templateUrl: './segmentation.component.html',
  styleUrls: ['./segmentation.component.scss']
})
export class SegmentationComponent implements OnInit {
  public segmentationFrom: FormGroup;
  public files: UploadFile[];
  public uploadInput: EventEmitter<UploadInput>;
  public humanizeBytes: Function;


  constructor( private formBuilder: FormBuilder,
               private consentService: ConsentService,
               private tokenService: TokenService) {
    // local uploading files array
    this.files = [];
    // input events, we use this to emit data to ngx-uploader
    this.uploadInput = new EventEmitter<UploadInput>();
    this.humanizeBytes = humanizeBytes;
  }

  ngOnInit() {
    this.segmentationFrom = this.buildSegementationForm();
  }

  private buildSegementationForm(): FormGroup{
    return this.formBuilder.group({
      intermediaryNpi: [null,
        [ Validators.required]
      ],
      recipientNpi: [null,
        [ Validators.required]
      ],
      purposeOfUse: [null,
        [ Validators.required]
      ],
      document: [null,
        [ Validators.required]
      ],
    });
  }

  onUploadOutput(output: UploadOutput): void {
    if (output.type === UploadOutputType.ADDED_TO_QUEUE.toString()) {
      this.files.push(output.file); // add file to array when added
    } else if (output.type === UploadOutputType.UPLOADING.toString()) {
      // update current data in files array for uploading file
      const index = this.files.findIndex(file => file.id === output.file.id);
      this.files[index] = output.file;
    } else if (output.type === UploadOutputType.REMOVED.toString()) {
      // remove file from array when removed
      this.files = this.files.filter((file: UploadFile) => file !== output.file);
    } else if (output.type === UploadOutputType.DONE.toString()) {
      // Handle download of filed
      console.log(output.file.response);
    }
  }

  segmentDocument(): void {
    const formModel = this.segmentationFrom.value;
    this.uploadInput.emit(this.prepareUploadInputObject(formModel));
  }

  private prepareSegmentationRequestObject(formContro: any):any{
    let segmentationRequest: SegmentationRequest = new SegmentationRequest();
    segmentationRequest.recipientNpi = formContro.recipientNpi;
    segmentationRequest.intermediaryNpi = formContro.intermediaryNpi;
    segmentationRequest.purposeOfUse = formContro.purposeOfUse;
    segmentationRequest.patientIdRoot = "";
    segmentationRequest.patientIdExtension = "";
    return segmentationRequest;
  }

  private prepareUploadInputObject(formModel:any): UploadInput{
    let uploadInput: UploadInput = {
        type: 'uploadAll',
        fieldName: 'file',
        url: this.consentService.getPepSegmentationDocumentUrl(),
        method: 'POST',
        data: this.prepareSegmentationRequestObject(formModel),
        concurrency: 1, // set sequential uploading of files with concurrency 1
        headers: this.tokenService.createAuthorizationHeaderObject()
    };
    return uploadInput;
  }
}
