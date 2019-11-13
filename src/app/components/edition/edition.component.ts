import { Component, OnInit } from '@angular/core';
import {DbnaryService} from '../../services/dbnary.service';
import {BoardService} from '../../services/board.service';
import {UsertoolbarService} from '../../services/usertoolbar.service';
import {GeticonService} from '../../services/geticon.service';
import {MulBerryObject} from '../../libTypes';
import mullberryJson from '../../../assets/symbol-info.json';
import {DomSanitizer} from '@angular/platform-browser';
import {Ng2ImgMaxService} from 'ng2-img-max';
import {Action, Element} from '../../types';
import {IndexeddbaccessService} from '../../services/indexeddbaccess.service';
import {ParametersService} from '../../services/parameters.service';
import {Router} from "@angular/router";

@Component({
  selector: 'app-edition',
  templateUrl: './edition.component.html',
  styleUrls: ['./edition.component.css']
})
export class EditionComponent implements OnInit {

  // par default un element est un bouton
  radioTypeFormat = 'button';
  // son nom est vide
  name = '';
  // il na pas devenement dinteraction
  events: { InteractionID: string, ActionList: Action[] }[] = [];
  // couleur grise
  color = '#d3d3d3';
  // pas d'image
  imageURL;
  // pas de classe grammaticale
  classe = '';
  // pas de forme variante
  variantList = [];

  // on choisit une image
  choseImage = false;
  // on choisit une variante
  variantDisplayed = false;
  // on choisit les evenements
  eventDisplayed = false;

  imageList: any[];

  // interaction actuellement selectionee
  currentInterractionNumber = -1;
  currentInterraction: { InteractionID: string, ActionList: Action[] } = null;

  constructor(private router: Router, public parametersService: ParametersService, public indexedDBacess: IndexeddbaccessService, public ng2ImgMaxService: Ng2ImgMaxService, public sanitizer: DomSanitizer, public userToolBar: UsertoolbarService, public getIconService: GeticonService, public dbnaryService: DbnaryService, public boardService: BoardService) {

  }
  /**
   * update the informations with the elementToModify if it exist and set the elementListener for listening next element modifications
   */
  ngOnInit() {
    this.updatemodif();
    this.userToolBar.ElementListener.subscribe(value => {
      if (value != null) {
        this.updatemodif();
      }
    });
  }

  /**
   * update the currentInterractionNumber and the currentInteraction with the interraction identified by i.
   * by default i=0 for click, i=1 for longpress and i=2 for doubleClick
   * return false otherwise
   * @param i, a number
   */
  selectInteraction(i: number) {
    this.currentInterractionNumber = i;
    this.currentInterraction = this.events.find(x => x.InteractionID === this.parametersService.interaction[i - 1]);
  }

  /**
   * return true if the given number i is the same as the current interaction number 'currentInterractionNumber'
   * return false otherwise
   * @param i, a number
   * @return true if i is the currentInterractionNumber, false otherwise
   */
  isCurrentInteraction(i) {
    return this.currentInterractionNumber === i;
  }

  /**
   * close the current opened panel if there is one (image, variant or event panel) and go back to main edition panel
   * otherwise close the edition menu
   * reset the information to its initial value
   */
  close() {
    // go back to main edition panel and close image, variant or event subpanel
    if (this.choseImage || this.variantDisplayed || this.eventDisplayed) {
    this.choseImage = false;
    this.variantDisplayed = false;
    this.eventDisplayed = false;
    this.currentInterractionNumber = -1;
    this.currentInterraction = null;
    // close the edition panel
    } else {
      this.userToolBar.add = false;
      this.userToolBar.modif = null;
      this.clear();
      this.router.navigate(['']);
    }
  }

  /**
   * add the selected variant forms in wordList to the current variantList
   * and close the variant panel by setting variantDisplayed to false
   */
  closeVariant() {
    this.variantList = this.dbnaryService.wordList.filter(b => b.selected);
    this.variantDisplayed = false ;
  }

  /**
   * Clear the informtation of the edition panel, reset all the information to their initial value
   */
  clear() {
    this.name = '';
    this.color = '#d3d3d3';
    this.imageURL = '';
    this.imageList = [];
    this.currentInterractionNumber = -1;
    this.currentInterraction = null;
    this.dbnaryService.wordList = [];
    this.dbnaryService.typeList = [];
  }

  /**
   * return the icon url corresponding to the string s
   * @param s, the string identifying the icon
   * @return the icon url
   */
  getIcon(s: string) {
    return this.getIconService.getIconUrl(s);
  }

  /**
   * Add the action identified by the actionId to the current interaction if it doesn't contain it already,
   * otherwise it delete it from the current interaction
   * @param actionId, the string identifying an action
   */
  addOrRemoveToInteraction(actionId: string) {
    const inter = this.parametersService.interaction[this.currentInterractionNumber - 1];
    const partOfCurrentInter = this.isPartOfCurrentInteraction(actionId);

    if (this.currentInterraction == null && !partOfCurrentInter) {
      this.currentInterraction = { InteractionID: inter, ActionList: [ {ActionID: actionId, Action: actionId} ] };
    } else if (!partOfCurrentInter) {
      this.currentInterraction.ActionList.push({ActionID: actionId, Action: actionId});
    } else if (partOfCurrentInter) {
      this.currentInterraction.ActionList = this.currentInterraction.ActionList.filter(x => x.ActionID !== actionId);
    }
    console.log(this.currentInterraction.ActionList);
  }

  /**
   * Return true if the action identified by actionId exists in the current interaction
   * return false otherwise
   * @param actionId, the string identifying an action
   * @return true if the action identified by actionId exists in the current interaction, false otherwise
   */
  isPartOfCurrentInteraction(actionId) {
    if (this.currentInterraction != null) {
      const res = this.currentInterraction.ActionList.find(x => x.ActionID === actionId);
      return res != null && res !== undefined;
    }
    return false;
  }

  /**
   * Return the list of 100 first mullberry library images, sorted by length name, matching with string 'text'
   *
   * @param text, the string researched text
   * @return list of 100 mulberry library images
   */
  searchInLib(text: string) {
    this.imageList = [];
    let tempList = [];
    (mullberryJson as unknown as MulBerryObject[]).forEach(value => {
      if (text !== null && text !== '' && value.symbol.toLowerCase().includes(text.toLocaleLowerCase())) {
        const url = value.symbol;
        tempList.push(url);
        tempList = tempList.sort((a: string, b: string) => {
            if (a.toLowerCase().startsWith(text.toLowerCase()) && b.toLowerCase().startsWith(text.toLowerCase())) {
              return a.length - b.length;
            } else if ( a.toLowerCase().startsWith(text.toLowerCase())) {
              return -1;
            } else {
              return 1;
            }

          }
        );
      }
    }, this);
    this.imageList = tempList.slice(0, 100);
  }

  /**
   * Set the current preview imageUrl with the image string Url 't' and close the chooseImage panel
   *
   * @param t, the new imageUrl
   */
  previewWithURL(t) {
    this.imageURL = t;
    this.choseImage = false;
  }

  /**
   * Set the current preview imageUrl with a mulberry library image Url according to the given string 't' and close the chooseImage panel
   *
   * @param t, the string short name of the image of the mulberry library image
   */
  previewMullberry(t: string) {
    this.previewWithURL('assets/libs/mulberry-symbols/EN-symbols/' + t + '.svg');
  }

  /**
   * Set the current preview imageUrl according to the given file 'file' and close the chooseImage panel
   * if the initial image is bigger than 1000*1000 the the image is reduced
   *
   * @param file, a file element
   */
  previewFile(file) {
    this.imageURL = 'assets/icons/load.gif';
    if (file.length === 0) {
      return;
    }
    const mimeType = file[0].type;
    if (mimeType.match(/image\/*/) == null) {
      return;
    }
    const reader = new FileReader();

    this.ng2ImgMaxService.resize([file[0]], 1000, 1000).subscribe(result => {
      reader.readAsDataURL(result);
      reader.onload = (e) => {
        this.imageURL = reader.result;
        this.choseImage = false;
      };
    }, error => {
      reader.readAsDataURL(file[0]);
      reader.onload = (e) => {
        this.previewWithURL(reader.result);

      };
    });
  }

  /**
   * Save the modified or new element update the indexedDB database with it and close the edition panel
   *
   */
  save() {
    if (this.userToolBar.add) {
      this.createNewButton();
    } else if (this.userToolBar.modif !== null) {
      this.modifyButton();
    }
    this.indexedDBacess.update();
    this.close();
  }

  /**
   * Update the current modified element and load its modifications into the board,
   * given the information of this class, updated by the edition html panel
   */
  modifyButton() {
    // tslint:disable-next-line:no-shadowed-variable
    const element: Element = this.userToolBar.modif;
    element.ElementType = this.radioTypeFormat;
    const defaultform = element.ElementForms.find(form => {
      const newForm = form.LexicInfos.find(info => {
        return (info.default != null && info.default);
      });
      return (newForm != null);
    });
    if (defaultform != null) {
    defaultform.DisplayedText = this.name;
    defaultform.VoiceText = this.name;
    } else {
      element.ElementForms.push({
        DisplayedText: this.name,
        VoiceText: this.name,
        LexicInfos: [{default: true}]
      });
    }
    this.variantList.forEach( variant => {
      element.ElementForms.push({
        DisplayedText: variant.val,
        VoiceText: variant.val,
        LexicInfos: variant.info
      });
    });
    element.Color = this.color;
    element.ImageID = this.boardService.currentFolder + this.name;

    this.boardService.board.ImageList = this.boardService.board.ImageList.filter(
      img => img.ImageID !== this.boardService.currentFolder + this.name);

    this.boardService.board.ImageList.push(
      {
        ImageID: this.boardService.currentFolder + this.name,
        ImageLabel: this.name,
        ImagePath: this.imageURL
      });
  }

  /**
   * Create a new button and add it to the board, given the information of this class, updated by the edition html panel
   */
  createNewButton() {
    const elementForms = [];
    elementForms.push({DisplayedText: this.name,
      VoiceText: this.name,
      LexicInfos: [{default: true}] });
    this.variantList.forEach( variant => {
      elementForms.push({
        DisplayedText: variant.val,
        VoiceText: variant.val,
        LexicInfos: variant.info
      });
    });

    const interList = [{
      InteractionID: 'click', ActionList: [{
        ActionID: 'display', Action: 'display'}, {
        ActionID: 'say', Action: 'say'}]}, {
      InteractionID: 'longPress', ActionList: [{
        ActionID: 'otherforms', Action: 'otherforms'}]}];



    this.boardService.board.ElementList.push(
      {
        ElementID: this.name,
        ElementFolder: this.boardService.currentFolder,
        ElementType: this.radioTypeFormat,
        ElementPartOfSpeech: this.classe,
        ElementForms: elementForms,
        ImageID: this.boardService.currentFolder + this.name,
        InteractionsList: interList,
        Color: this.color
      });

    this.boardService.board.ImageList.push(
      {
        ImageID: this.boardService.currentFolder + this.name,
        ImageLabel: this.name,
        ImagePath: this.imageURL
      });
  }

  /**
   * Load the information of the element we have to modify, given by this.userToolBar.modif into the current informations of the class:
   * 'name' is the name of current element to modify, 'events' is the interraction event list, 'color' is its color
   * 'radioTypeFormat' is its current type format (button or folder) and imageUrl is its current imageUrl
   */
  updatemodif() {
    if (this.userToolBar.modif !== null) {
    const elementToModif: Element = this.userToolBar.modif;
    this.name = elementToModif.ElementForms[0].DisplayedText;
    this.events = elementToModif.InteractionsList;
    this.color = elementToModif.Color;
    this.radioTypeFormat = elementToModif.ElementType;
    const imageToModif = this.boardService.board.ImageList.find(x => x.ImageID === elementToModif.ImageID);
    this.imageURL = imageToModif.ImagePath;
  }
  }

  /**
   * Actualize the grammatical type list (typeList)  of the word 'word'
   * (ex: if word = 'bleu' typeList will be ['-nom-','-adj-'] because bleu can be a noun or an adjective
   * @param word, a string word
   */
  getWordList(word) {
    this.variantDisplayed = true;
    this.dbnaryService.typeList = [];
    this.dbnaryService.startsearch(1);
    this.dbnaryService.getWordPartOfSpeech(word, this.dbnaryService.typeList);
  }

  /**
   * Return the current interaction event list (events) and display the html event panel by setting eventDisplayed to true
   *
   * @return the current list of interaction events
   */
  getEvents() {
    this.eventDisplayed = true;
    return this.events;
  }

  /**
   * Actualize the variants forms list (wordList) of the word 'word' with the grammatical type b
   * (ex: displayVariant('-nom-','chien') will actualise the wordList with ['chien','chiens','chienne','chiennes'])
   * @param b, a grammatical type (ex: -verb-, -nom-...).
   * @param word, a string word
   */
  displayVariant(b: string, word: string) {
    this.dbnaryService.wordList = [];
    this.dbnaryService.startsearch(2);
    this.dbnaryService.getOtherFormsOfThisPartOfSpeechWord(word, b, this.dbnaryService.wordList);
  }
}

