import crypto from "node:crypto";
import CryptoJS from "crypto-js";
import { unlinkSync } from "node:fs";
import { decode } from "jsonwebtoken";
import { compareSync, hashSync } from "bcrypt";
import {
  CREATE_ERROR,
  GET_MESSAGE,
  VALIDATE_REQUEST_DATA,
  UNIX_TIME,
  RANDOM_NUMBER,
  CREATE_SLUG,
  TO_LOWER_CASE,
  TO_UPPER_CASE,
  PHONE_VALIDATION,
  EMAIL_VALIDATION,
  MINUTES,
  GET_USER_NAME,
  HASH_PASSWORD,
  CHECK_PASSWORD,
  RANDOM_KEY_AND_IV,
  RANDOM_STRING,
  GET_FILE_NAME,
  PHOTO_URL,
  IMAGE_URL,
  FILE_URL,
  REMOVE_PHOTO,
  REMOVE_IMAGE,
  REMOVE_FILE,
  CREATE_PASSWORD,
  LOGO_URL,
  REMOVE_LOGO,
  GENERATE_ADDRESS_SLUG,
  REMOVE_IMAGES,
  CREATE_SKU,
  BILL_CALCULATOR,
  GENERATE_REF_NUMBER,
  GENERATE_ORDER_ID,
  GENERATE_REFERRAL_CODE,
  ADD_WHITESPACE,
  CURRENT_WEEK_DAYS,
  GET_RENEWAL_DATE,
} from "@/types/helper";
import User from ".././models/user";
import Address from "@/models/address";
import Order from "@/models/order";
import Referral from "@/models/referral";
import Payment from "@/models/payment";
import constants from "@/utils/constants";

export const createError: CREATE_ERROR = async (status: any, message: any) => {
  const error: any = new Error();
  error.status = status;
  error.message = message;

  return error;
};

export const getMessage: GET_MESSAGE = async (msg: any) => {
  const errMsg: any = Object.values(msg.errors)[0];
  return errMsg[0];
};

export const validateRequestData: VALIDATE_REQUEST_DATA = async (
  validationRule: object,
  data: object
) => {
  const entries1 = Object.entries(validationRule);
  const entries2 = Object.entries(data);

  if (entries1.length < entries2.length) {
    return false;
  }

  for (const [key, value] of entries2) {
    if (!validationRule.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
};

export const unixTime: UNIX_TIME = async (date) => {
  return new Date(date).getTime();
};

export const randomNumber: RANDOM_NUMBER = async () => {
  const num = crypto.randomInt(100000, 999999);
  return num;
};

export const createSlug: CREATE_SLUG = async (text) => {
  let slug = text.toLowerCase();
  slug = slug.replace(/[^a-z0-9\-_\s]/g, ""); // Remove non-alphanumeric characters
  slug = slug.replace(/\s+/g, "-"); // Replace spaces with hyphens
  slug = slug.replace(/[-_]+/g, "-"); // Remove  hyphens and underscores
  slug = slug.replace(/^-+|-+$/g, ""); //  Remove leading and trailing hyphens and underscores
  return slug;
};

export const toLowerCase: TO_LOWER_CASE = async (text) => {
  return text.toLowerCase();
};

export const toUpperCase: TO_UPPER_CASE = async (text) => {
  return text.toLowerCase();
};
export const validateExcelColumns = async (cols: any, data: any) => {
  const keys = Object.values(data[0]);
  if (data[0].keys > keys.length) {
    throw {
      status: false,
      message: constants.message.unwantedColumns,
    };
  } else if (data[0].keys < keys.length) {
    throw {
      status: false,
      message: constants.message.columnMissing,
    };
  } else {
    const validateKeyNames = keys.map(
      (ele: any, index: number) => cols[index] === ele
    );
    if (validateKeyNames.includes(false)) {
      throw {
        status: false,
        message: constants.message.columnNameMisMatching,
      };
    } else {
      const excelData = data.map((ele: any) =>
        Object.fromEntries(
          Object.entries(ele).map(([key, value]: any, indx: number) => [
            keys[indx],
            value,
          ])
        )
      );
      return excelData;
    }
  }
};

export const emailValidation: EMAIL_VALIDATION = async (email) => {
  const emails = [
    "0815.ru",
    "0815.ru0clickemail.com",
    "0815.ry",
    "0815.su",
    "0845.ru",
    "0clickemail.com",
    "0-mail.com",
    "0wnd.net",
    "0wnd.org",
    "10mail.com",
    "10minut.com.pl",
    "10mail.org",
    "10minutemail.cf",
    "10minutemail.co.za",
    "10minutemail.com",
    "10minutemail.de",
    "10minutemail.ga",
    "10minutemail.gq",
    "10minutemail.ml",
    "10minutemail.net",
    "10minutesmail.com",
    "10x9.com",
    "123-m.com",
    "126.com",
    "12houremail.com",
    "12minutemail.com",
    "12minutemail.net",
    "139.com",
    "163.com",
    "1ce.us",
    "1chuan.com",
    "1fsdfdsfsdf.tk",
    "1mail.ml",
    "1pad.de",
    "1zhuan.com",
    "20mail.it",
    "20minutemail.com",
    "21cn.com",
    "24hourmail.com",
    "2fdgdfgdfgdf.tk",
    "2prong.com",
    "30minutemail.com",
    "33mail.com",
    "3d-painting.com",
    "3mail.ga",
    "3trtretgfrfe.tk",
    "420blaze.it",
    "4gfdsgfdgfd.tk",
    "4mail.cf",
    "4mail.ga",
    "4warding.com",
    "4warding.net",
    "4warding.org",
    "5ghgfhfghfgh.tk",
    "5mail.cf",
    "5mail.ga",
    "60minutemail.com",
    "675hosting.com",
    "675hosting.net",
    "675hosting.org",
    "6hjgjhgkilkj.tk",
    "6ip.us",
    "6mail.cf",
    "6mail.ga",
    "6mail.ml",
    "6paq.com",
    "6url.com",
    "75hosting.com",
    "75hosting.net",
    "75hosting.org",
    "7days-printing.com",
    "7mail.ga",
    "7mail.ml",
    "7tags.com",
    "8127ep.com",
    "8chan.co",
    "8mail.cf",
    "8mail.ga",
    "8mail.ml",
    "99experts.com",
    "9mail.cf",
    "9ox.net",
    "a.mailcker.com",
    "a.vztc.com",
    "a45.in",
    "a-bc.net",
    "abyssmail.com",
    "afrobacon.com",
    "ag.us.to",
    "agedmail.com",
    "ajaxapp.net",
    "akapost.com",
    "akerd.com",
    "aktiefmail.nl",
    "alivance.com",
    "amail4.me",
    "ama-trade.de",
    "ama-trans.de",
    "amilegit.com",
    "amiri.net",
    "amiriindustries.com",
    "anappthat.com",
    "ano-mail.net",
    "anonbox.net",
    "anon-mail.de",
    "anonmails.de",
    "anonymail.dk",
    "anonymbox.com",
    "anonymousmail.org",
    "anonymousspeech.com",
    "antichef.com",
    "antichef.net",
    "antireg.com",
    "antireg.ru",
    "antispam.de",
    "antispam24.de",
    "antispammail.de",
    "armyspy.com",
    "artman-conception.com",
    "asdasd.nl",
    "asdasd.ru",
    "atvclub.msk.ru",
    "auti.st",
    "avpa.nl",
    "azmeil.tk",
    "b2cmail.de",
    "baxomale.ht.cx",
    "beddly.com",
    "beefmilk.com",
    "big1.us",
    "bigprofessor.so",
    "bigstring.com",
    "binkmail.com",
    "bio-muesli.info",
    "bio-muesli.net",
    "blackmarket.to",
    "bladesmail.net",
    "bloatbox.com",
    "blogmyway.org",
    "blogos.com",
    "bluebottle.com",
    "bobmail.info",
    "bodhi.lawlita.com",
    "bofthew.com",
    "bootybay.de",
    "boun.cr",
    "bouncr.com",
    "boxformail.in",
    "boximail.com",
    "br.mintemail.com",
    "brainonfire.net",
    "breakthru.com",
    "brefmail.com",
    "brennendesreich.de",
    "broadbandninja.com",
    "bsnow.net",
    "bspamfree.org",
    "bu.mintemail.com",
    "buffemail.com",
    "bugmenever.com",
    "bugmenot.com",
    "bumpymail.com",
    "bund.us",
    "bundes-li.ga",
    "burnthespam.info",
    "burstmail.info",
    "buymoreplays.com",
    "buyusedlibrarybooks.org",
    "byom.de",
    "c2.hu",
    "cachedot.net",
    "cam4you.cc",
    "card.zp.ua",
    "casualdx.com",
    "cc.liamria",
    "cek.pm",
    "cellurl.com",
    "centermail.com",
    "centermail.net",
    "chammy.info",
    "cheatmail.de",
    "childsavetrust.org",
    "chogmail.com",
    "choicemail1.com",
    "chong-mail.com",
    "chong-mail.net",
    "chong-mail.org",
    "clixser.com",
    "clrmail.com",
    "cmail.com",
    "cmail.net",
    "cmail.org",
    "cock.li",
    "coieo.com",
    "coldemail.info",
    "consumerriot.com",
    "cool.fr.nf",
    "correo.blogos.net",
    "cosmorph.com",
    "courriel.fr.nf",
    "courrieltemporaire.com",
    "crapmail.org",
    "crazymailing.com",
    "cubiclink.com",
    "cumallover.me",
    "curryworld.de",
    "cust.in",
    "cuvox.de",
    "d3p.dk",
    "dacoolest.com",
    "dandikmail.com",
    "dayrep.com",
    "dbunker.com",
    "dcemail.com",
    "deadaddress.com",
    "deadchildren.org",
    "deadfake.cf",
    "deadfake.ga",
    "deadfake.ml",
    "deadfake.tk",
    "deadspam.com",
    "deagot.com",
    "dealja.com",
    "delikkt.de",
    "despam.it",
    "despammed.com",
    "devnullmail.com",
    "dfgh.net",
    "dharmatel.net",
    "dicksinhisan.us",
    "dicksinmyan.us",
    "digitalsanctuary.com",
    "dingbone.com",
    "discard.cf",
    "discard.email",
    "discard.ga",
    "discard.gq",
    "discard.ml",
    "discard.tk",
    "discardmail.com",
    "discardmail.de",
    "disposable.cf",
    "disposable.ga",
    "disposable.ml",
    "disposableaddress.com",
    "disposable-email.ml",
    "disposableemailaddresses.com",
    "disposableinbox.com",
    "dispose.it",
    "disposeamail.com",
    "disposemail.com",
    "dispostable.com",
    "divermail.com",
    "dm.w3internet.co.uk",
    "dm.w3internet.co.ukexample.com",
    "docmail.com",
    "dodgeit.com",
    "dodgit.com",
    "dodgit.org",
    "doiea.com",
    "domozmail.com",
    "donemail.ru",
    "dontreg.com",
    "dontsendmespam.de",
    "dotman.de",
    "dotmsg.com",
    "drdrb.com",
    "drdrb.net",
    "dropcake.de",
    "droplister.com",
    "dropmail.me",
    "dudmail.com",
    "dumpandjunk.com",
    "dump-email.info",
    "dumpmail.de",
    "dumpyemail.com",
    "duskmail.com",
    "e4ward.com",
    "easytrashmail.com",
    "edv.to",
    "ee1.pl",
    "ee2.pl",
    "eelmail.com",
    "einmalmail.de",
    "einrot.com",
    "einrot.de",
    "eintagsmail.de",
    "e-mail.com",
    "email.net",
    "e-mail.org",
    "email60.com",
    "emailage.cf",
    "emailage.ga",
    "emailage.gq",
    "emailage.ml",
    "emailage.tk",
    "emaildienst.de",
    "email-fake.cf",
    "email-fake.ga",
    "email-fake.gq",
    "email-fake.ml",
    "email-fake.tk",
    "emailgo.de",
    "emailias.com",
    "emailigo.de",
    "emailinfive.com",
    "emaillime.com",
    "emailmiser.com",
    "emails.ga",
    "emailsensei.com",
    "emailspam.cf",
    "emailspam.ga",
    "emailspam.gq",
    "emailspam.ml",
    "emailspam.tk",
    "emailtemporanea.com",
    "emailtemporanea.net",
    "emailtemporar.ro",
    "emailtemporario.com.br",
    "emailthe.net",
    "emailtmp.com",
    "emailto.de",
    "emailwarden.com",
    "emailx.at.hm",
    "emailxfer.com",
    "emailz.cf",
    "emailz.ga",
    "emailz.gq",
    "emailz.ml",
    "emeil.in",
    "emeil.ir",
    "emkei.cf",
    "emkei.ga",
    "emkei.gq",
    "emkei.ml",
    "emkei.tk",
    "emz.net",
    "enterto.com",
    "ephemail.net",
    "e-postkasten.com",
    "e-postkasten.de",
    "e-postkasten.eu",
    "e-postkasten.info",
    "ero-tube.org",
    "etranquil.com",
    "etranquil.net",
    "etranquil.org",
    "evopo.com",
    "example.com",
    "explodemail.com",
    "express.net.ua",
    "eyepaste.com",
    "facebook-email.cf",
    "facebook-email.ga",
    "facebook-email.ml",
    "facebookmail.gq",
    "facebookmail.ml",
    "faecesmail.me",
    "fakedemail.com",
    "fakeinbox.cf",
    "fakeinbox.com",
    "fakeinbox.ga",
    "fakeinbox.ml",
    "fakeinbox.tk",
    "fakeinformation.com",
    "fake-mail.cf",
    "fakemail.fr",
    "fake-mail.ga",
    "fake-mail.ml",
    "fakemailgenerator.com",
    "fakemailz.com",
    "fammix.com",
    "fansworldwide.de",
    "fantasymail.de",
    "fastacura.com",
    "fastchevy.com",
    "fastchrysler.com",
    "fastermail.com",
    "fastkawasaki.com",
    "fastmail.fm",
    "fastmazda.com",
    "fastmitsubishi.com",
    "fastnissan.com",
    "fastsubaru.com",
    "fastsuzuki.com",
    "fasttoyota.com",
    "fastyamaha.com",
    "fatflap.com",
    "fdfdsfds.com",
    "fightallspam.com",
    "film-blog.biz",
    "filzmail.com",
    "fivemail.de",
    "fixmail.tk",
    "fizmail.com",
    "fleckens.hu",
    "flurred.com",
    "flyspam.com",
    "fly-ts.de",
    "footard.com",
    "forgetmail.com",
    "fornow.eu",
    "fr33mail.info",
    "frapmail.com",
    "freecoolemail.com",
    "free-email.cf",
    "free-email.ga",
    "freeletter.me",
    "freemail.ms",
    "freemails.cf",
    "freemails.ga",
    "freemails.ml",
    "freundin.ru",
    "friendlymail.co.uk",
    "front14.org",
    "fuckingduh.com",
    "fuckmail.me",
    "fudgerub.com",
    "fux0ringduh.com",
    "fyii.de",
    "garbagemail.org",
    "garliclife.com",
    "garrifulio.mailexpire.com",
    "gawab.com",
    "gehensiemirnichtaufdensack.de",
    "gelitik.in",
    "geschent.biz",
    "get1mail.com",
    "get2mail.fr",
    "getairmail.cf",
    "getairmail.com",
    "getairmail.ga",
    "getairmail.gq",
    "getairmail.ml",
    "getairmail.tk",
    "get-mail.cf",
    "get-mail.ga",
    "get-mail.ml",
    "get-mail.tk",
    "getmails.eu",
    "getonemail.com",
    "getonemail.net",
    "ghosttexter.de",
    "giantmail.de",
    "girlsundertheinfluence.com",
    "gishpuppy.com",
    "gmal.com",
    "gmial.com",
    "gmx.com",
    "goat.si",
    "goemailgo.com",
    "gomail.in",
    "gorillaswithdirtyarmpits.com",
    "gotmail.com",
    "gotmail.net",
    "gotmail.org",
    "gotti.otherinbox.com",
    "gowikibooks.com",
    "gowikicampus.com",
    "gowikicars.com",
    "gowikifilms.com",
    "gowikigames.com",
    "gowikimusic.com",
    "gowikinetwork.com",
    "gowikitravel.com",
    "gowikitv.com",
    "grandmamail.com",
    "grandmasmail.com",
    "great-host.in",
    "greensloth.com",
    "grr.la",
    "gsrv.co.uk",
    "guerillamail.biz",
    "guerillamail.com",
    "guerillamail.net",
    "guerillamail.org",
    "guerillamailblock.com",
    "guerrillamail.biz",
    "guerrillamail.com",
    "guerrillamail.de",
    "guerrillamail.info",
    "guerrillamail.net",
    "guerrillamail.org",
    "guerrillamailblock.com",
    "gustr.com",
    "h.mintemail.com",
    "h8s.org",
    "hacccc.com",
    "haltospam.com",
    "harakirimail.com",
    "hartbot.de",
    "hatespam.org",
    "hat-geld.de",
    "herp.in",
    "hidemail.de",
    "hidzz.com",
    "hmamail.com",
    "hochsitze.com",
    "hooohush.ai",
    "hopemail.biz",
    "horsefucker.org",
    "hotmai.com",
    "hot-mail.cf",
    "hot-mail.ga",
    "hot-mail.gq",
    "hot-mail.ml",
    "hot-mail.tk",
    "hotmial.com",
    "hotpop.com",
    "huajiachem.cn",
    "hulapla.de",
    "humaility.com",
    "hush.ai",
    "hush.com",
    "hushmail.com",
    "hushmail.me",
    "i2pmail.org",
    "ieatspam.eu",
    "ieatspam.info",
    "ieh-mail.de",
    "ignoremail.com",
    "ihateyoualot.info",
    "iheartspam.org",
    "ikbenspamvrij.nl",
    "imails.info",
    "imgof.com",
    "imgv.de",
    "imstations.com",
    "inbax.tk",
    "inbox.si",
    "inbox2.info",
    "inboxalias.com",
    "inboxclean.com",
    "inboxclean.org",
    "inboxdesign.me",
    "inboxed.im",
    "inboxed.pw",
    "inboxstore.me",
    "incognitomail.com",
    "incognitomail.net",
    "incognitomail.org",
    "infocom.zp.ua",
    "insorg-mail.info",
    "instantemailaddress.com",
    "instant-mail.de",
    "iozak.com",
    "ip6.li",
    "ipoo.org",
    "irish2me.com",
    "iroid.com",
    "is.af",
    "iwantmyname.com",
    "iwi.net",
    "jetable.com",
    "jetable.fr.nf",
    "jetable.net",
    "jetable.org",
    "jnxjn.com",
    "jourrapide.com",
    "jsrsolutions.com",
    "junk.to",
    "junk1e.com",
    "junkmail.ga",
    "junkmail.gq",
    "k2-herbal-incenses.com",
    "kasmail.com",
    "kaspop.com",
    "keepmymail.com",
    "killmail.com",
    "killmail.net",
    "kir.ch.tc",
    "klassmaster.com",
    "klassmaster.net",
    "klzlk.com",
    "kmhow.com",
    "kostenlosemailadresse.de",
    "koszmail.pl",
    "kulturbetrieb.info",
    "kurzepost.de",
    "l33r.eu",
    "lackmail.net",
    "lags.us",
    "landmail.co",
    "lastmail.co",
    "lavabit.com",
    "lawlita.com",
    "letthemeatspam.com",
    "lhsdv.com",
    "lifebyfood.com",
    "link2mail.net",
    "linuxmail.so",
    "litedrop.com",
    "llogin.ru",
    "loadby.us",
    "login-email.cf",
    "login-email.ga",
    "login-email.ml",
    "login-email.tk",
    "lol.com",
    "lol.ovpn.to",
    "lolfreak.net",
    "lookugly.com",
    "lopl.co.cc",
    "lortemail.dk",
    "losemymail.com",
    "lovebitco.in",
    "lovemeleaveme.com",
    "loves.dicksinhisan.us",
    "loves.dicksinmyan.us",
    "lr7.us",
    "lr78.com",
    "lroid.com",
    "luckymail.org",
    "lukop.dk",
    "luv2.us",
    "m21.cc",
    "m4ilweb.info",
    "ma1l.bij.pl",
    "maboard.com",
    "mac.hush.com",
    "mail.by",
    "mail.me",
    "mail.mezimages.net",
    "mail.ru",
    "mail.zp.ua",
    "mail114.net",
    "mail1a.de",
    "mail21.cc",
    "mail2rss.org",
    "mail2world.com",
    "mail333.com",
    "mail4trash.com",
    "mailbidon.com",
    "mailbiz.biz",
    "mailblocks.com",
    "mailbucket.org",
    "mailcat.biz",
    "mailcatch.com",
    "mailde.de",
    "mailde.info",
    "maildrop.cc",
    "maildrop.cf",
    "maildrop.ga",
    "maildrop.gq",
    "maildrop.ml",
    "maildu.de",
    "maileater.com",
    "mailed.in",
    "maileimer.de",
    "mailexpire.com",
    "mailfa.tk",
    "mail-filter.com",
    "mailforspam.com",
    "mailfree.ga",
    "mailfree.gq",
    "mailfree.ml",
    "mailfreeonline.com",
    "mailguard.me",
    "mailhazard.com",
    "mailhazard.us",
    "mailhz.me",
    "mailimate.com",
    "mailin8r.com",
    "mailinater.com",
    "mailinator.com",
    "mailinator.gq",
    "mailinator.net",
    "mailinator.org",
    "mailinator.us",
    "mailinator2.com",
    "mailincubator.com",
    "mailismagic.com",
    "mailita.tk",
    "mailjunk.cf",
    "mailjunk.ga",
    "mailjunk.gq",
    "mailjunk.ml",
    "mailjunk.tk",
    "mailme.gq",
    "mailme.ir",
    "mailme.lv",
    "mailme24.com",
    "mailmetrash.com",
    "mailmoat.com",
    "mailms.com",
    "mailnator.com",
    "mailnesia.com",
    "mailnull.com",
    "mailorg.org",
    "mailpick.biz",
    "mailquack.com",
    "mailrock.biz",
    "mailsac.com",
    "mailscrap.com",
    "mailseal.de",
    "mailshell.com",
    "mailsiphon.com",
    "mailslapping.com",
    "mailslite.com",
    "mailtemp.info",
    "mail-temporaire.fr",
    "mailtome.de",
    "mailtothis.com",
    "mailtrash.net",
    "mailtv.net",
    "mailtv.tv",
    "mailwithyou.com",
    "mailzilla.com",
    "mailzilla.org",
    "makemetheking.com",
    "malahov.de",
    "manifestgenerator.com",
    "manybrain.com",
    "mbx.cc",
    "mega.zik.dj",
    "meinspamschutz.de",
    "meltmail.com",
    "messagebeamer.de",
    "mezimages.net",
    "mierdamail.com",
    "migmail.pl",
    "migumail.com",
    "ministry-of-silly-walks.de",
    "mintemail.com",
    "misterpinball.de",
    "mjukglass.nu",
    "mmmmail.com",
    "moakt.com",
    "mobi.web.id",
    "mobileninja.co.uk",
    "moburl.com",
    "moncourrier.fr.nf",
    "monemail.fr.nf",
    "monmail.fr.nf",
    "monumentmail.com",
    "ms9.mailslite.com",
    "msa.minsmail.com",
    "msb.minsmail.com",
    "msg.mailslite.com",
    "mt2009.com",
    "mt2014.com",
    "mt2015.com",
    "muchomail.com",
    "mx0.wwwnew.eu",
    "my10minutemail.com",
    "mycard.net.ua",
    "mycleaninbox.net",
    "myemailboxy.com",
    "mymail-in.net",
    "mynetstore.de",
    "mypacks.net",
    "mypartyclip.de",
    "myphantomemail.com",
    "mysamp.de",
    "myspaceinc.com",
    "myspaceinc.net",
    "myspaceinc.org",
    "myspacepimpedup.com",
    "myspamless.com",
    "mytempemail.com",
    "mytempmail.com",
    "mythrashmail.net",
    "mytrashmail.com",
    "nabuma.com",
    "national.shitposting.agency",
    "naver.com",
    "neomailbox.com",
    "nepwk.com",
    "nervmich.net",
    "nervtmich.net",
    "netmails.com",
    "netmails.net",
    "netzidiot.de",
    "neverbox.com",
    "nevermail.de",
    "nice-4u.com",
    "nigge.rs",
    "nincsmail.hu",
    "nmail.cf",
    "nnh.com",
    "noblepioneer.com",
    "nobugmail.com",
    "nobulk.com",
    "nobuma.com",
    "noclickemail.com",
    "nogmailspam.info",
    "nomail.pw",
    "nomail.xl.cx",
    "nomail2me.com",
    "nomorespamemails.com",
    "nonspam.eu",
    "nonspammer.de",
    "noref.in",
    "nospam.wins.com.br",
    "no-spam.ws",
    "nospam.ze.tc",
    "nospam4.us",
    "nospamfor.us",
    "nospammail.net",
    "nospamthanks.info",
    "notmailinator.com",
    "notsharingmy.info",
    "nowhere.org",
    "nowmymail.com",
    "ntlhelp.net",
    "nullbox.info",
    "nurfuerspam.de",
    "nus.edu.sg",
    "nwldx.com",
    "o2.co.uk",
    "o2.pl",
    "objectmail.com",
    "obobbo.com",
    "odaymail.com",
    "odnorazovoe.ru",
    "ohaaa.de",
    "omail.pro",
    "oneoffemail.com",
    "oneoffmail.com",
    "onewaymail.com",
    "onlatedotcom.info",
    "online.ms",
    "oopi.org",
    "opayq.com",
    "ordinaryamerican.net",
    "otherinbox.com",
    "ourklips.com",
    "outlawspam.com",
    "ovpn.to",
    "owlpic.com",
    "pancakemail.com",
    "paplease.com",
    "pcusers.otherinbox.com",
    "pepbot.com",
    "pfui.ru",
    "phentermine-mortgages-texas-holdem.biz",
    "pimpedupmyspace.com",
    "pjjkp.com",
    "plexolan.de",
    "poczta.onet.pl",
    "politikerclub.de",
    "poofy.org",
    "pookmail.com",
    "postonline.me",
    "powered.name",
    "privacy.net",
    "privatdemail.net",
    "privy-mail.com",
    "privymail.de",
    "privy-mail.de",
    "proxymail.eu",
    "prtnx.com",
    "prtz.eu",
    "punkass.com",
    "put2.net",
    "putthisinyourspamdatabase.com",
    "pwrby.com",
    "qasti.com",
    "qisdo.com",
    "qisoa.com",
    "qoika.com",
    "qq.com",
    "quickinbox.com",
    "quickmail.nl",
    "rcpt.at",
    "rcs.gaggle.net",
    "reallymymail.com",
    "realtyalerts.ca",
    "receiveee.com",
    "recode.me",
    "recursor.net",
    "recyclemail.dk",
    "redchan.it",
    "regbypass.com",
    "regbypass.comsafe-mail.net",
    "rejectmail.com",
    "reliable-mail.com",
    "remail.cf",
    "remail.ga",
    "rhyta.com",
    "rklips.com",
    "rmqkr.net",
    "royal.net",
    "rppkn.com",
    "rtrtr.com",
    "s0ny.net",
    "safe-mail.net",
    "safersignup.de",
    "safetymail.info",
    "safetypost.de",
    "sandelf.de",
    "saynotospams.com",
    "scatmail.com",
    "schafmail.de",
    "schmeissweg.tk",
    "schrott-email.de",
    "secmail.pw",
    "secretemail.de",
    "secure-mail.biz",
    "secure-mail.cc",
    "selfdestructingmail.com",
    "selfdestructingmail.org",
    "sendspamhere.com",
    "senseless-entertainment.com",
    "server.ms",
    "services391.com",
    "sharklasers.com",
    "shieldedmail.com",
    "shieldemail.com",
    "shiftmail.com",
    "shitmail.me",
    "shitmail.org",
    "shitware.nl",
    "shmeriously.com",
    "shortmail.net",
    "shut.name",
    "shut.ws",
    "sibmail.com",
    "sify.com",
    "sina.cn",
    "sina.com",
    "sinnlos-mail.de",
    "siteposter.net",
    "skeefmail.com",
    "sky-ts.de",
    "slapsfromlastnight.com",
    "slaskpost.se",
    "slave-auctions.net",
    "slopsbox.com",
    "slushmail.com",
    "smaakt.naar.gravel",
    "smapfree24.com",
    "smapfree24.de",
    "smapfree24.eu",
    "smapfree24.info",
    "smapfree24.org",
    "smashmail.de",
    "smellfear.com",
    "snakemail.com",
    "sneakemail.com",
    "sneakmail.de",
    "snkmail.com",
    "sofimail.com",
    "sofortmail.de",
    "sofort-mail.de",
    "sogetthis.com",
    "sohu.com",
    "solvemail.info",
    "soodomail.com",
    "soodonims.com",
    "spam.la",
    "spam.su",
    "spam4.me",
    "spamail.de",
    "spamarrest.com",
    "spamavert.com",
    "spam-be-gone.com",
    "spambob.com",
    "spambob.net",
    "spambob.org",
    "spambog.com",
    "spambog.de",
    "spambog.net",
    "spambog.ru",
    "spambooger.com",
    "spambox.info",
    "spambox.irishspringrealty.com",
    "spambox.org",
    "spambox.us",
    "spamcannon.com",
    "spamcannon.net",
    "spamcero.com",
    "spamcon.org",
    "spamcorptastic.com",
    "spamcowboy.com",
    "spamcowboy.net",
    "spamcowboy.org",
    "spamday.com",
    "spamdecoy.net",
    "spamex.com",
    "spamfighter.cf",
    "spamfighter.ga",
    "spamfighter.gq",
    "spamfighter.ml",
    "spamfighter.tk",
    "spamfree.eu",
    "spamfree24.com",
    "spamfree24.de",
    "spamfree24.eu",
    "spamfree24.info",
    "spamfree24.net",
    "spamfree24.org",
    "spamgoes.in",
    "spamgourmet.com",
    "spamgourmet.net",
    "spamgourmet.org",
    "spamherelots.com",
    "spamhereplease.com",
    "spamhole.com",
    "spamify.com",
    "spaminator.de",
    "spamkill.info",
    "spaml.com",
    "spaml.de",
    "spammotel.com",
    "spamobox.com",
    "spamoff.de",
    "spamsalad.in",
    "spamslicer.com",
    "spamspot.com",
    "spamstack.net",
    "spamthis.co.uk",
    "spamthisplease.com",
    "spamtrail.com",
    "spamtroll.net",
    "speed.1s.fr",
    "spoofmail.de",
    "squizzy.de",
    "sry.li",
    "ssoia.com",
    "startkeys.com",
    "stinkefinger.net",
    "stop-my-spam.cf",
    "stop-my-spam.com",
    "stop-my-spam.ga",
    "stop-my-spam.ml",
    "stop-my-spam.tk",
    "stuffmail.de",
    "suioe.com",
    "super-auswahl.de",
    "supergreatmail.com",
    "supermailer.jp",
    "superplatyna.com",
    "superrito.com",
    "superstachel.de",
    "suremail.info",
    "sweetxxx.de",
    "tafmail.com",
    "tagyourself.com",
    "talkinator.com",
    "tapchicuoihoi.com",
    "techemail.com",
    "techgroup.me",
    "teewars.org",
    "teleworm.com",
    "teleworm.us",
    "temp.emeraldwebmail.com",
    "tempail.com",
    "tempalias.com",
    "tempemail.biz",
    "tempemail.co.za",
    "tempemail.com",
    "tempe-mail.com",
    "tempemail.net",
    "tempimbox.com",
    "tempinbox.co.uk",
    "tempinbox.com",
    "tempmail.eu",
    "tempmail.it",
    "temp-mail.org",
    "temp-mail.ru",
    "tempmail2.com",
    "tempmaildemo.com",
    "tempmailer.com",
    "tempmailer.de",
    "tempomail.fr",
    "temporarily.de",
    "temporarioemail.com.br",
    "temporaryemail.net",
    "temporaryemail.us",
    "temporaryforwarding.com",
    "temporaryinbox.com",
    "temporarymailaddress.com",
    "tempthe.net",
    "tempymail.com",
    "tfwno.gf",
    "thanksnospam.info",
    "thankyou2010.com",
    "thc.st",
    "thecloudindex.com",
    "thelimestones.com",
    "thisisnotmyrealemail.com",
    "thismail.net",
    "thrma.com",
    "throam.com",
    "throwawayemailaddress.com",
    "throwawaymail.com",
    "tijdelijkmailadres.nl",
    "tilien.com",
    "tittbit.in",
    "tizi.com",
    "tmail.com",
    "tmailinator.com",
    "toiea.com",
    "tokem.co",
    "toomail.biz",
    "topcoolemail.com",
    "topfreeemail.com",
    "topranklist.de",
    "tormail.net",
    "tormail.org",
    "tradermail.info",
    "trash2009.com",
    "trash2010.com",
    "trash2011.com",
    "trash-amil.com",
    "trashcanmail.com",
    "trashdevil.com",
    "trashdevil.de",
    "trashemail.de",
    "trashinbox.com",
    "trashmail.at",
    "trash-mail.at",
    "trash-mail.cf",
    "trashmail.com",
    "trash-mail.com",
    "trashmail.de",
    "trash-mail.de",
    "trash-mail.ga",
    "trash-mail.gq",
    "trashmail.me",
    "trash-mail.ml",
    "trashmail.net",
    "trashmail.org",
    "trash-mail.tk",
    "trashmail.ws",
    "trashmailer.com",
    "trashymail.com",
    "trashymail.net",
    "trayna.com",
    "trbvm.com",
    "trialmail.de",
    "trickmail.net",
    "trillianpro.com",
    "tryalert.com",
    "turual.com",
    "twinmail.de",
    "tyldd.com",
    "ubismail.net",
    "uggsrock.com",
    "umail.net",
    "upliftnow.com",
    "uplipht.com",
    "uroid.com",
    "us.af",
    "uyhip.com",
    "valemail.net",
    "venompen.com",
    "verticalscope.com",
    "veryrealemail.com",
    "veryrealmail.com",
    "vidchart.com",
    "viditag.com",
    "viewcastmedia.com",
    "viewcastmedia.net",
    "viewcastmedia.org",
    "vipmail.name",
    "vipmail.pw",
    "viralplays.com",
    "vistomail.com",
    "vomoto.com",
    "vpn.st",
    "vsimcard.com",
    "vubby.com",
    "vztc.com",
    "walala.org",
    "walkmail.net",
    "wants.dicksinhisan.us",
    "wants.dicksinmyan.us",
    "wasteland.rfc822.org",
    "watchfull.net",
    "watch-harry-potter.com",
    "webemail.me",
    "webm4il.info",
    "webuser.in",
    "wegwerfadresse.de",
    "wegwerfemail.com",
    "wegwerfemail.de",
    "wegwerf-email.de",
    "weg-werf-email.de",
    "wegwerfemail.net",
    "wegwerf-email.net",
    "wegwerfemail.org",
    "wegwerf-email-addressen.de",
    "wegwerfemailadresse.com",
    "wegwerf-email-adressen.de",
    "wegwerf-emails.de",
    "wegwerfmail.de",
    "wegwerfmail.info",
    "wegwerfmail.net",
    "wegwerfmail.org",
    "wegwerpmailadres.nl",
    "wegwrfmail.de",
    "wegwrfmail.net",
    "wegwrfmail.org",
    "wetrainbayarea.com",
    "wetrainbayarea.org",
    "wh4f.org",
    "whatiaas.com",
    "whatpaas.com",
    "whatsaas.com",
    "whopy.com",
    "whyspam.me",
    "wickmail.net",
    "wilemail.com",
    "willhackforfood.biz",
    "willselfdestruct.com",
    "winemaven.info",
    "wmail.cf",
    "wolfsmail.tk",
    "writeme.us",
    "wronghead.com",
    "wuzup.net",
    "wuzupmail.net",
    "www.e4ward.com",
    "www.gishpuppy.com",
    "www.mailinator.com",
    "wwwnew.eu",
    "x.ip6.li",
    "xagloo.co",
    "xagloo.com",
    "xemaps.com",
    "xents.com",
    "xmail.com",
    "xmaily.com",
    "xoxox.cc",
    "xoxy.net",
    "xxtreamcam.com",
    "xyzfree.net",
    "yandex.com",
    "yanet.me",
    "yapped.net",
    "yeah.net",
    "yep.it",
    "yogamaven.com",
    "yomail.info",
    "yopmail.com",
    "yopmail.fr",
    "yopmail.gq",
    "yopmail.net",
    "youmail.ga",
    "youmailr.com",
    "yourdomain.com",
    "you-spam.com",
    "ypmail.webarnak.fr.eu.org",
    "yuurok.com",
    "yxzx.net",
    "z1p.biz",
    "za.com",
    "zebins.com",
    "zebins.eu",
    "zehnminuten.de",
    "zehnminutenmail.de",
    "zetmail.com",
    "zippymail.info",
    "zoaxe.com",
    "zoemail.com",
    "zoemail.net",
    "zoemail.org",
    "zomg.info",
  ];

  return emails.includes(email.split("@")[1]);
};

export const phoneValidation: PHONE_VALIDATION = async (
  isoCode,
  phoneNumber
) => {
  switch (isoCode) {
    case "AF":
      var regex = /^(\+93)[2-7]\d{8}$/;
      return regex.test(phoneNumber);
    case "AX":
      var regex = /^((\+358?)|\+)[1||4][5||8]\d{5,8}$/;
      return regex.test(phoneNumber);
    case "IN":
      var regex = /^((\+91?)|\+)[6-9][0-9]{9}$/;
      return regex.test(phoneNumber);
    case "US":
      var regex = /^((\+1?)|\+)?([2-9][0-8][0-9])?([2-9][0-9]{2})?([0-9]{4})$/;
      return regex.test(phoneNumber);
  }
};

export const minutes: MINUTES = async (time) => {
  const prevTime = new Date(time).getTime();
  const curnTime = new Date().getTime();
  const minutes = Math.round((curnTime - prevTime) / 1000 / 60);
  return minutes;
};

export const getUserName: GET_USER_NAME = async (email) => {
  const username = email.split("@")[0];

  return await User.findOne({
    username,
  }).then(async (data) => {
    if (data) {
      const getNewUserName: GET_USER_NAME = async (email) => {
        const newUserName = `${email.split("@")[0]}${Math.floor(
          10 + Math.random() * 90
        )}`;

        return await User.findOne({ username: newUserName }).then((data) => {
          if (data) {
            return getNewUserName(email);
          } else {
            return newUserName;
          }
        });
      };
      return getNewUserName(email);
    } else {
      return username;
    }
  });
};

export const hashPassword: HASH_PASSWORD = async (password) => {
  const saltRounds = 15;
  return hashSync(password, saltRounds);
};

export const checkPassword: CHECK_PASSWORD = async (password, hash) => {
  return compareSync(password, hash);
};

export const randomKeyAndIV: RANDOM_KEY_AND_IV = async (length) => {
  const str = Array.from({ length: length }, () =>
    "0123456789abcdef".charAt(Math.floor(Math.random() * 16))
  ).join("");
  const key = CryptoJS.enc.Hex.parse(str);
  return key;
};

export const randomString: RANDOM_STRING = async (length) => {
  const str = Array.from({ length: length }, () =>
    "0123456789aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ".charAt(
      Math.floor(Math.random() * 62)
    )
  ).join("");

  return str;
};

export const getFileName: GET_FILE_NAME = async (fileUrl) => {
  const index = fileUrl.lastIndexOf("/") + 1;
  return fileUrl.substring(index);
};

export const photoURL: PHOTO_URL = async (host, filename) => {
  if (process.env.NODE_ENV === "dev") {
    return `http://${host}/photos/${filename}`;
  } else {
    return `https://${host}/photos/${filename}`;
  }
};

export const logoURL: LOGO_URL = async (host, filename) => {
  if (process.env.NODE_ENV === "dev") {
    return `http://${host}/logos/${filename}`;
  } else {
    return `https://${host}/logos/${filename}`;
  }
};

export const imageURL: IMAGE_URL = async (host, filename) => {
  if (process.env.NODE_ENV === "dev") {
    return `http://${host}/images/${filename}`;
  } else {
    return `https://${host}/images/${filename}`;
  }
};



export const fileURL: FILE_URL = async (host, filename) => {
  if (process.env.NODE_ENV === "dev") {
    return `http://${host}/files/${filename}`;
  } else {
    return `https://${host}/files/${filename}`;
  }
};

export const removePhoto: REMOVE_PHOTO = async (filename) => {
  return unlinkSync(`public/photos/${filename}`);
};

export const removeLogo: REMOVE_LOGO = async (filename) => {
  return unlinkSync(`public/logos/${filename}`);
};

export const removeImage: REMOVE_IMAGE = async (filename) => {
  return unlinkSync(`public/images/${filename}`);
};

export const removeImages: REMOVE_IMAGES = async (files) => {
  return files.forEach((file: any) => {
    unlinkSync(`public/images/${file.filename}`);
  });
};

export const removeFile: REMOVE_FILE = async (filename) => {
  return unlinkSync(`public/files/${filename}`);
};

export const createPassword: CREATE_PASSWORD = async (name, dob) => {
  const newName = name.charAt(0).toUpperCase() + name.slice(1);
  const date = new Date(dob);
  const year = date.getFullYear();
  return `${newName}@${year}`;
};

//Add Spaces Between Words Starting with Capital Letters using Regex
export const addWhiteSpace: ADD_WHITESPACE = async (str) => {
  return str.replace(/([A-Z])/g, " $&");
};

export const generateAddressSlug: GENERATE_ADDRESS_SLUG = async (
  name,
  addressType,
  pincode
) => {
  const slug: string = `${
    name.split(" ")[0]
  }-${addressType}-${pincode}-${Math.floor(1000 + Math.random() * 9000)}`;

  return await Address.findOne({
    slug: slug,
  }).then(async (data) => {
    if (data) {
      return generateAddressSlug(name, addressType, pincode);
    } else {
      return slug;
    }
  });
};

export const createSKU: CREATE_SKU = async (category, brand, body) => {
  const lengthInches = Number(body.product_length) * 0.3937;
  const heightInches = Number(body.product_height) * 0.3937;
  const diagonal = Math.sqrt(
    lengthInches * lengthInches + heightInches * heightInches
  );

  const sku = `${category.substring(0, 3)}${brand.substring(
    0,
    3
  )}${body.product_name.substring(0, 3)}${Math.floor(
    diagonal
  )}${body.currency_code.substring(0, 2)}`;

  return sku.toUpperCase();
};

export const billCalculator: BILL_CALCULATOR = async (data, quantity) => {
  const shipping = !data.additionalCharge.shipping
    ? 0
    : data.additionalCharge.shipping;
  const packaging = !data.additionalCharge.packaging
    ? 0
    : data.additionalCharge.packaging;

  if (data.taxIncluded) {
    const total = data.mrp * quantity;
    const subTotal = data.sellingPrice * quantity;
    const discount = total - subTotal;
    const discountPercent = ((total - subTotal) / total) * 100;
    const taxableAmount = subTotal / (1 + data.tax.value / 100);
    const taxAmount = subTotal - taxableAmount;
    const netAmount = taxableAmount + taxAmount + shipping + packaging;
    return {
      total: Math.ceil(total),
      subTotal: Math.ceil(subTotal),
      discount: Math.ceil(discount),
      discountPercent: Math.ceil(discountPercent),
      taxableAmount: Math.ceil(taxableAmount),
      taxAmount: Math.ceil(taxAmount),
      netAmount: Math.ceil(netAmount),
    };
  } else {
    const total =
      (data.mrp * quantity * data.tax.value) / 100 + data.mrp * quantity;
    const subTotal =
      (data.sellingPrice * quantity * data.tax.value) / 100 +
      data.sellingPrice * quantity;
    const discount = total - subTotal;
    const discountPercent = ((total - subTotal) / total) * 100;
    const taxableAmount = subTotal - (subTotal - data.sellingPrice * quantity);
    const taxAmount = subTotal - data.sellingPrice * quantity;
    const netAmount = taxableAmount + taxAmount + shipping + packaging;

    return {
      total: Math.ceil(total),
      subTotal: Math.ceil(subTotal),
      discount: Math.ceil(discount),
      discountPercent: Math.ceil(discountPercent),
      taxableAmount: Math.ceil(taxableAmount),
      taxAmount: Math.ceil(taxAmount),
      netAmount: Math.ceil(netAmount),
    };
  }
};

export const generateRefNumber: GENERATE_REF_NUMBER = async () => {
  return `PEAK${crypto.randomInt(100, 999)}${Date.now()}${crypto.randomInt(
    100,
    999
  )}`;
};

export const generateOrderID: GENERATE_ORDER_ID = async () => {
  const orderId = `OD${crypto.randomInt(
    1000,
    9999
  )}${Date.now()}${crypto.randomInt(10000, 99999)}`;

  return await Payment.findOne({
    orderNumber: orderId,
  }).then(async (data) => {
    if (data) {
      return generateOrderID();
    } else {
      return orderId;
    }
  });
};

export const generateReferralCode: GENERATE_REFERRAL_CODE = async () => {
  const str = Array.from({ length: 6 }, () =>
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(Math.floor(Math.random() * 26))
  ).join("");
  const num = crypto.randomInt(1000, 9999);
  const referralCode = str + num;

  return await Referral.findOne({
    referralCode: referralCode,
  }).then(async (data) => {
    if (data) {
      return generateReferralCode();
    } else {
      return referralCode;
    }
  });
};

export const checkAnswer = async (defineAnswer: any, givenAnswer: any) => {
  if (defineAnswer.length < givenAnswer.length) {
    return false;
  } else {
    const answers = defineAnswer.map((item: any) => item.value);
    const isCorrect = givenAnswer.every((item: any) =>
      answers.includes(item.value)
    );
    return isCorrect;
  }
};

export const currentWeekDays: CURRENT_WEEK_DAYS = async () => {
  const weekDays = [];
  for (let i = 0; i <= 6; i++) {
    const today = new Date();
    if (i <= today.getDay()) {
      weekDays.push(new Date(today.setDate(today.getDate() - i)));
    } else {
      const nextDay = i - today.getDay();
      weekDays.push(new Date(today.setDate(today.getDate() + nextDay)));
    }
  }

  return weekDays.sort(function (a: any, b: any) {
    return b - a;
  });
};

export const getRenewalDate: GET_RENEWAL_DATE = async (cycle) => {
  const recurringCycle: any = {
    daily: function () {
      return new Date(new Date().setHours(23, 59, 59));
    },
    biweekly: function () {
      const today = new Date();
      const updatedTime = new Date(today.setDate(today.getDate() + 3));
      return new Date(updatedTime.setHours(23, 59, 59));
    },
    weekly: function () {
      const today = new Date();
      const updatedTime = new Date(today.setDate(today.getDate() + 7));
      return new Date(updatedTime.setHours(23, 59, 59));
    },
    monthly: function () {
      const today = new Date();
      const updatedTime = new Date(today.setMonth(today.getMonth() + 1));
      return new Date(updatedTime.setHours(23, 59, 59));
    },
    quarterly: function () {
      const today = new Date();
      const updatedTime = new Date(today.setMonth(today.getMonth() + 6));
      return new Date(updatedTime.setHours(23, 59, 59));
    },
    annually: function () {
      const today = new Date();
      const updatedTime = new Date(today.setMonth(today.getMonth() + 12));
      return new Date(updatedTime.setHours(23, 59, 59));
    },
  };

  return recurringCycle[cycle]();
};


export const jwtDecode = async (token: string) => {
  return decode(token);
};