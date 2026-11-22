/**
 * The example models, written by scripts/build-examples.ts from the files
 * in examples/: do not edit by hand.
 *
 * @author Roberto Metere
 * @license GPL-2.0-or-later
 */
class Examples {
  /**
   * The examples, in the order of the menu: id, file name, title and note
   * (in English, translated where they show), pretty printing hints (the
   * text of a .pp file) and model.
   *
   * @type {Array<Object>}
   */
  static LIST = [
      {
          id: "handshake"
        , file: "handshake.pv"
        , title: I18n.mark("Handshake (flawed)")
        , note: I18n.mark("Secrecy and authentication fail: a man in the middle learns the key.")
        , pp: ""
        , source: "(* Handshake protocol in the style of the ProVerif manual (flawed version).\n   Server B accepts any public key pkX, so a man in the middle can learn\n   the session key k: both secrecy of s and authentication fail. *)\n\nfree c: channel.\n\ntype pkey.\ntype skey.\ntype spkey.\ntype sskey.\ntype key.\n\n(* Public-key encryption *)\nfun pk(skey): pkey.\nfun aenc(bitstring, pkey): bitstring.\nreduc forall m: bitstring, k: skey; adec(aenc(m, pk(k)), k) = m.\n\n(* Signatures with message recovery *)\nfun spk(sskey): spkey.\nfun sign(bitstring, sskey): bitstring.\nreduc forall m: bitstring, k: sskey; getmess(sign(m, k)) = m.\nreduc forall m: bitstring, k: sskey; checksign(sign(m, k), spk(k)) = m.\n\n(* Symmetric encryption *)\nfun senc(bitstring, key): bitstring.\nreduc forall m: bitstring, k: key; sdec(senc(m, k), k) = m.\n\nfree s: bitstring [private].\n\nevent acceptsClient(key).\nevent acceptsServer(key, pkey).\nevent termClient(key, pkey).\nevent termServer(key).\n\nquery attacker(s).\nquery x: key, y: pkey; event(termClient(x, y)) ==> event(acceptsServer(x, y)).\nquery x: key; inj-event(termServer(x)) ==> inj-event(acceptsClient(x)).\n\nlet clientA(pkA: pkey, skA: skey, pkB: spkey) =\n  out(c, pkA);\n  in(c, x: bitstring);\n  let y = adec(x, skA) in\n  let (=pkB, k: key) = checksign(y, pkB) in\n  event acceptsClient(k);\n  out(c, senc(s, k));\n  event termClient(k, pkA).\n\nlet serverB(pkB: spkey, skB: sskey, pkA: pkey) =\n  in(c, pkX: pkey);\n  new k: key;\n  event acceptsServer(k, pkX);\n  out(c, aenc(sign((pkB, k), skB), pkX));\n  in(c, x: bitstring);\n  let z = sdec(x, k) in\n  if pkX = pkA then\n  event termServer(k).\n\nprocess\n  new skA: skey;\n  new skB: sskey;\n  let pkA = pk(skA) in\n  out(c, pkA);\n  let pkB = spk(skB) in\n  out(c, pkB);\n  ( !clientA(pkA, skA, pkB) | !serverB(pkB, skB, pkA) )\n"
      }
    , {
          id: "handshake-fixed"
        , file: "handshake-fixed.pv"
        , title: I18n.mark("Handshake (fixed)")
        , note: I18n.mark("The server signs the client key: all queries hold.")
        , pp: ""
        , source: "(* Handshake protocol, corrected: the server signs the client's public key\n   together with the session key, and the client checks it. *)\n\nfree c: channel.\n\ntype pkey.\ntype skey.\ntype spkey.\ntype sskey.\ntype key.\n\nfun pk(skey): pkey.\nfun aenc(bitstring, pkey): bitstring.\nreduc forall m: bitstring, k: skey; adec(aenc(m, pk(k)), k) = m.\n\nfun spk(sskey): spkey.\nfun sign(bitstring, sskey): bitstring.\nreduc forall m: bitstring, k: sskey; getmess(sign(m, k)) = m.\nreduc forall m: bitstring, k: sskey; checksign(sign(m, k), spk(k)) = m.\n\nfun senc(bitstring, key): bitstring.\nreduc forall m: bitstring, k: key; sdec(senc(m, k), k) = m.\n\nfree s: bitstring [private].\n\nevent acceptsClient(key).\nevent acceptsServer(key, pkey).\nevent termClient(key, pkey).\nevent termServer(key).\n\nquery attacker(s).\nquery x: key, y: pkey; event(termClient(x, y)) ==> event(acceptsServer(x, y)).\nquery x: key; inj-event(termServer(x)) ==> inj-event(acceptsClient(x)).\n\nlet clientA(pkA: pkey, skA: skey, pkB: spkey) =\n  out(c, pkA);\n  in(c, x: bitstring);\n  let y = adec(x, skA) in\n  let (=pkA, =pkB, k: key) = checksign(y, pkB) in\n  event acceptsClient(k);\n  out(c, senc(s, k));\n  event termClient(k, pkA).\n\nlet serverB(pkB: spkey, skB: sskey, pkA: pkey) =\n  in(c, pkX: pkey);\n  new k: key;\n  event acceptsServer(k, pkX);\n  out(c, aenc(sign((pkX, pkB, k), skB), pkX));\n  in(c, x: bitstring);\n  let z = sdec(x, k) in\n  if pkX = pkA then\n  event termServer(k).\n\nprocess\n  new skA: skey;\n  new skB: sskey;\n  let pkA = pk(skA) in\n  out(c, pkA);\n  let pkB = spk(skB) in\n  out(c, pkB);\n  ( !clientA(pkA, skA, pkB) | !serverB(pkB, skB, pkA) )\n"
      }
    , {
          id: "notation"
        , file: "notation.pv"
        , title: I18n.mark("Signed Diffie-Hellman, in paper notation")
        , note: I18n.mark("Pretty printing hints: g^a, {m}_k, x || y.")
        , pp: "(* Notation of notation.pv for PieStudio. A .pp file holds hints that name\n   their symbol, one per line, so that the model itself needs no comment. *)\n\n@notation 'sk_A' skA\n@notation 'sk_B' skB\n@color '#2f6bff' Alice\n@color '#c2185b' Bob\n"
        , source: "(* Signed Diffie-Hellman, in the notation of a paper.\n   The hints are ProVerif comments, so ProVerif reads this file as it is.\n   In the Design mode the diagram writes exp(g, a) as g^a, senc(m, k) as\n   {m}_k and concat(x, y) as x || y. A hint just before a declaration or an\n   action applies to it; the hints that name their symbol are at the end of\n   this file and in notation.pp, which the studio opens with the example.\n   The hints before the outputs and the inputs name the three messages,\n   which the arrows join.\n   Bob signs both halves of the key, so the payload stays secret; but he never\n   learns who sent g^a, so the attacker can talk to him in Alice's name. *)\n\nfree c: channel.\n\ntype G.\ntype exponent.\ntype skey.\ntype pkey.\ntype key.\n\nconst g: G [data].\n\n(* @notation '{#1}^{#2}' *)\nfun exp(G, exponent): G.\nequation forall x: exponent, y: exponent; exp(exp(g, x), y) = exp(exp(g, y), x).\n\n(* @notation 'H(#1)' *)\nfun h(G): key.\n\nfun pk(skey): pkey.\n(* @notation '\\mathsf{sig}_{#2}(#1)' *)\nfun sign(bitstring, skey): bitstring.\nreduc forall m: bitstring, k: skey; checksign(sign(m, k), pk(k)) = m.\n\n(* @notation '\\{#1\\}_{#2}' *)\nfun senc(bitstring, key): bitstring.\nreduc forall m: bitstring, k: key; sdec(senc(m, k), k) = m.\n\n(* @infix '\\|' *)\nfun concat(bitstring, bitstring): bitstring.\n(* @notation '\\left. #1 \\right|_1' *)\nreduc forall a: bitstring, b: bitstring; fst(concat(a, b)) = a.\n(* @notation '\\left. #1 \\right|_2' *)\nreduc forall a: bitstring, b: bitstring; snd(concat(a, b)) = b.\n\nfree idA: bitstring.\nfree payload: bitstring [private].\n\nevent sent(bitstring, G, G).\nevent received(bitstring, G, G).\n\n(* @label 'the payload stays secret' *)\nquery attacker(payload).\n(* @label 'Bob accepts only what Alice sent' *)\nquery x: bitstring, ga: G, gb: G; event(received(x, ga, gb)) ==> event(sent(x, ga, gb)).\n\n(* @label 'Alice' *)\nlet Alice(skA: skey, pkB: pkey) =\n  new a: exponent;\n  (* @inout m1 *)\n  out(c, exp(g, a));\n  (* @inout m2 *)\n  in(c, (gb: G, s: bitstring));\n  let (=exp(g, a), =gb) = checksign(s, pkB) in\n  (* @notation 'k \\leftarrow H(g^{ab})' *)\n  let k = h(exp(gb, a)) in\n  event sent(payload, exp(g, a), gb);\n  (* @inout m3 *)\n  out(c, senc(concat(idA, payload), k)).\n\n(* @label 'Bob' *)\nlet Bob(skB: skey, pkA: pkey) =\n  (* @label 'nobody vouches for $g^a$' @color '#c62828' @inout m1 *)\n  in(c, ga: G);\n  new b: exponent;\n  (* @inout m2 *)\n  out(c, (exp(g, b), sign((ga, exp(g, b)), skB)));\n  (* @inout m3 *)\n  in(c, m: bitstring);\n  let k = h(exp(ga, b)) in\n  let x = sdec(m, k) in\n  if fst(x) = idA then\n  event received(snd(x), ga, exp(g, b)).\n\nprocess\n  new skA: skey;\n  new skB: skey;\n  out(c, pk(skA));\n  out(c, pk(skB));\n  ( !Alice(skA, pk(skB)) | !Bob(skB, pk(skA)) )\n\n(**\n * Deferred hints: they name their symbol, so they can be anywhere.\n * @notation '\\mathsf{vk}(#1)' pk\n * @notation 'M' payload\n * @notation '\\mathit{id}_A' idA\n *)\n"
      }
    , {
          id: "symmetric"
        , file: "symmetric.pv"
        , title: I18n.mark("Key confirmation (symmetric role)")
        , note: I18n.mark("One role run by both devices, drawn with its mirrored copy.")
        , pp: ""
        , source: "(* Key confirmation between two devices that share a long-term key.\n   Both devices run the same role, so the diagram shows the role once and\n   its mirrored copy in grey: each output of one is the matching input of\n   the other. The MAC names both devices, so the attacker cannot reflect a\n   device's own message back to it: all the goals hold. To see the\n   reflection attack, take the names out of both MACs (mac((n, m), k) and\n   mac((m, n), k)) and verify again. *)\n\nfree c: channel.\n\ntype host.\ntype nonce.\ntype key.\n\n(* @notation '\\mathsf{mac}_{#2}(#1)' *)\nfun mac(bitstring, key): bitstring.\n\nfree A, B: host.\nfree kAB: key [private].\n\nevent running(host, host, nonce, nonce).\nevent commit(host, host, nonce, nonce).\n\n(* @label 'kAB stays secret' *)\nquery attacker(kAB).\n(* @label 'agreement on both nonces' *)\nquery a: host, b: host, x: nonce, y: nonce; event(commit(a, b, x, y)) ==> event(running(b, a, y, x)).\n\n(* @label 'Paired device'\n   @symmetric *)\nlet Device(k: key, me: host, peer: host) =\n  new n: nonce;\n  out(c, (me, n));\n  in(c, (=peer, m: nonce));\n  event running(me, peer, n, m);\n  out(c, mac((me, n, m), k));\n  in(c, t: bitstring);\n  if t = mac((peer, m, n), k) then\n  event commit(me, peer, n, m).\n\nprocess\n  ( !Device(kAB, A, B) | !Device(kAB, B, A) )\n"
      }
    , {
          id: "nspk"
        , file: "nspk.pv"
        , title: I18n.mark("Needham-Schroeder public key")
        , note: I18n.mark("Lowe's attack on the authentication of the responder.")
        , pp: ""
        , source: "(* Needham-Schroeder public-key protocol and Lowe's man-in-the-middle attack.\n     A -> B : {Na, A}pkB\n     B -> A : {Na, Nb}pkA\n     A -> B : {Nb}pkB\n   Keys are registered in a table; the attacker may register keys for\n   dishonest hosts. *)\n\nfree c: channel.\n\ntype host.\ntype nonce.\ntype pkey.\ntype skey.\n\nfun pk(skey): pkey.\nfun aenc(bitstring, pkey): bitstring.\nreduc forall m: bitstring, k: skey; adec(aenc(m, pk(k)), k) = m.\nfun nonce2b(nonce): bitstring [data, typeConverter].\nfun senc(bitstring, nonce): bitstring.\nreduc forall m: bitstring, k: nonce; sdec(senc(m, k), k) = m.\n\nfree A, B: host.\ntable keys(host, pkey).\n\nfree secretANa, secretANb, secretBNa, secretBNb: bitstring [private].\n\nevent beginBparam(host, host).\nevent endBparam(host, host).\nevent beginAparam(host, host).\nevent endAparam(host, host).\n\nquery attacker(secretANa); attacker(secretANb); attacker(secretBNa); attacker(secretBNb).\nquery x: host, y: host; inj-event(endBparam(x, y)) ==> inj-event(beginBparam(x, y)).\nquery x: host, y: host; inj-event(endAparam(x, y)) ==> inj-event(beginAparam(x, y)).\n\nlet initiator(pkA: pkey, skA: skey) =\n  in(c, hostX: host);\n  get keys(=hostX, pkX) in\n  event beginBparam(A, hostX);\n  new Na: nonce;\n  out(c, aenc((Na, A), pkX));\n  in(c, m2: bitstring);\n  let (=Na, Nb: nonce) = adec(m2, skA) in\n  out(c, aenc(nonce2b(Nb), pkX));\n  if hostX = B then\n  event endAparam(A, hostX);\n  out(c, senc(secretANa, Na));\n  out(c, senc(secretANb, Nb)).\n\nlet responder(pkB: pkey, skB: skey) =\n  in(c, m1: bitstring);\n  let (NX: nonce, hostY: host) = adec(m1, skB) in\n  get keys(=hostY, pkY) in\n  event beginAparam(hostY, B);\n  new Nb: nonce;\n  out(c, aenc((NX, Nb), pkY));\n  in(c, m3: bitstring);\n  if nonce2b(Nb) = adec(m3, skB) then\n  if hostY = A then\n  event endBparam(hostY, B);\n  out(c, senc(secretBNa, NX));\n  out(c, senc(secretBNb, Nb)).\n\nlet keyRegistration =\n  in(c, (h: host, k: pkey));\n  if h <> A && h <> B then\n  insert keys(h, k).\n\nprocess\n  new skA: skey;\n  let pkA = pk(skA) in\n  out(c, pkA);\n  insert keys(A, pkA);\n  new skB: skey;\n  let pkB = pk(skB) in\n  out(c, pkB);\n  insert keys(B, pkB);\n  ( !initiator(pkA, skA) | !responder(pkB, skB) | !keyRegistration )\n"
      }
    , {
          id: "nsl"
        , file: "nsl.pv"
        , title: I18n.mark("Needham-Schroeder-Lowe")
        , note: I18n.mark("The fix: the responder names itself in message 2.")
        , pp: ""
        , source: "(* Needham-Schroeder-Lowe: the responder's identity in message 2 fixes Lowe's attack.\n     A -> B : {Na, A}pkB\n     B -> A : {Na, Nb}pkA\n     A -> B : {Nb}pkB\n   Keys are registered in a table; the attacker may register keys for\n   dishonest hosts. *)\n\nfree c: channel.\n\ntype host.\ntype nonce.\ntype pkey.\ntype skey.\n\nfun pk(skey): pkey.\nfun aenc(bitstring, pkey): bitstring.\nreduc forall m: bitstring, k: skey; adec(aenc(m, pk(k)), k) = m.\nfun nonce2b(nonce): bitstring [data, typeConverter].\nfun senc(bitstring, nonce): bitstring.\nreduc forall m: bitstring, k: nonce; sdec(senc(m, k), k) = m.\n\nfree A, B: host.\ntable keys(host, pkey).\n\nfree secretANa, secretANb, secretBNa, secretBNb: bitstring [private].\n\nevent beginBparam(host, host).\nevent endBparam(host, host).\nevent beginAparam(host, host).\nevent endAparam(host, host).\n\nquery attacker(secretANa); attacker(secretANb); attacker(secretBNa); attacker(secretBNb).\nquery x: host, y: host; inj-event(endBparam(x, y)) ==> inj-event(beginBparam(x, y)).\nquery x: host, y: host; inj-event(endAparam(x, y)) ==> inj-event(beginAparam(x, y)).\n\nlet initiator(pkA: pkey, skA: skey) =\n  in(c, hostX: host);\n  get keys(=hostX, pkX) in\n  event beginBparam(A, hostX);\n  new Na: nonce;\n  out(c, aenc((Na, A), pkX));\n  in(c, m2: bitstring);\n  let (=Na, Nb: nonce, =hostX) = adec(m2, skA) in\n  out(c, aenc(nonce2b(Nb), pkX));\n  if hostX = B then\n  event endAparam(A, hostX);\n  out(c, senc(secretANa, Na));\n  out(c, senc(secretANb, Nb)).\n\nlet responder(pkB: pkey, skB: skey) =\n  in(c, m1: bitstring);\n  let (NX: nonce, hostY: host) = adec(m1, skB) in\n  get keys(=hostY, pkY) in\n  event beginAparam(hostY, B);\n  new Nb: nonce;\n  out(c, aenc((NX, Nb, B), pkY));\n  in(c, m3: bitstring);\n  if nonce2b(Nb) = adec(m3, skB) then\n  if hostY = A then\n  event endBparam(hostY, B);\n  out(c, senc(secretBNa, NX));\n  out(c, senc(secretBNb, Nb)).\n\nlet keyRegistration =\n  in(c, (h: host, k: pkey));\n  if h <> A && h <> B then\n  insert keys(h, k).\n\nprocess\n  new skA: skey;\n  let pkA = pk(skA) in\n  out(c, pkA);\n  insert keys(A, pkA);\n  new skB: skey;\n  let pkB = pk(skB) in\n  out(c, pkB);\n  insert keys(B, pkB);\n  ( !initiator(pkA, skA) | !responder(pkB, skB) | !keyRegistration )\n"
      }
    , {
          id: "forward-secrecy"
        , file: "forward-secrecy.pv"
        , title: I18n.mark("Signed Diffie-Hellman, phases")
        , note: I18n.mark("Long-term keys leak in phase 1; the session secret survives.")
        , pp: ""
        , source: "(* Forward secrecy with phases: the long-term key leaks in phase 1.\n   A session key encrypted under the long-term key is not forward secret;\n   a Diffie-Hellman key signed with the long-term key is. *)\n\nfree c: channel.\n\ntype G.\ntype exponent.\ntype sskey.\ntype spkey.\ntype key.\n\nconst g: G [data].\nfun exp(G, exponent): G.\nequation forall x: exponent, y: exponent; exp(exp(g, x), y) = exp(exp(g, y), x).\nfun G2key(G): key [typeConverter].\n\nfun spk(sskey): spkey.\nfun sign(bitstring, sskey): bitstring.\nreduc forall m: bitstring, k: sskey; checksign(sign(m, k), spk(k)) = m.\n\nfun senc(bitstring, key): bitstring.\nreduc forall m: bitstring, k: key; sdec(senc(m, k), k) = m.\n\nfun G2b(G): bitstring [data, typeConverter].\n\nfree secretA: bitstring [private].\n\nquery attacker(secretA) phase 1.\n\ntable done(G).\n\nlet initiator(skA: sskey, pkB: spkey) =\n  new x: exponent;\n  out(c, sign(G2b(exp(g, x)), skA));\n  in(c, m: bitstring);\n  let G2b(gy) = checksign(m, pkB) in\n  let k = G2key(exp(gy, x)) in\n  insert done(exp(g, x));\n  out(c, senc(secretA, k)).\n\nlet responder(skB: sskey, pkA: spkey) =\n  in(c, m: bitstring);\n  let G2b(gx) = checksign(m, pkA) in\n  new y: exponent;\n  out(c, sign(G2b(exp(g, y)), skB)).\n\nprocess\n  new skA: sskey;\n  new skB: sskey;\n  out(c, spk(skA));\n  out(c, spk(skB));\n  (\n    !initiator(skA, spk(skB))\n  ) | (\n    !responder(skB, spk(skA))\n  ) | (\n    phase 1;\n    out(c, (skA, skB))\n  )\n"
      }
    , {
          id: "password"
        , file: "password.pv"
        , title: I18n.mark("Weak secret and non-interference")
        , note: I18n.mark("Off-line guessing breaks the password.")
        , pp: ""
        , source: "(* Weak secrets and non-interference.\n   A hash of the password is published: an off-line dictionary attack\n   recovers it, so the weak secret property fails.  The session secret\n   only appears encrypted under a fresh key, so it is non-interferent. *)\n\nfree c: channel.\ntype key.\nfun h(bitstring): bitstring.\nfun senc(bitstring, key): bitstring.\nreduc forall m: bitstring, k: key; sdec(senc(m, k), k) = m.\n\nfree pw: bitstring [private].\nfree secretMsg: bitstring [private].\n\nweaksecret pw.\nnoninterf secretMsg.\n\nprocess\n  ( out(c, h(pw)) ) | ( new k: key; out(c, senc(secretMsg, k)) )\n"
      }
    , {
          id: "strong-secrecy"
        , file: "strong-secrecy.pv"
        , title: I18n.mark("Strong secrecy (biprocess)")
        , note: I18n.mark("choice[,] and observational equivalence.")
        , pp: ""
        , source: "(* Strong secrecy as observational equivalence of a biprocess.\n   Deterministic encryption leaks equality of plaintexts: the attacker\n   compares two ciphertexts, so the equivalence does not hold. *)\n\nfree c: channel.\ntype key.\nfun senc(bitstring, key): bitstring.\nreduc forall m: bitstring, k: key; sdec(senc(m, k), k) = m.\n\nfree m1, m2: bitstring.\n\nprocess\n  new k: key;\n  ( out(c, senc(choice[m1, m2], k)) | out(c, senc(m1, k)) )\n"
      }
    , {
          id: "mixed-goals"
        , file: "mixed-goals.pv"
        , title: I18n.mark("Mixed goals (split export)")
        , note: I18n.mark("Queries and choice together: verified, and exported, as several files.")
        , pp: ""
        , source: "(* A model with goals ProVerif cannot verify in one run:\n   a reachability query (secrecy of the key) and strong secrecy of the\n   vote (a biprocess with choice).  Export it as several files to verify\n   each goal separately. *)\n\nfree c: channel.\ntype key.\nfun senc(bitstring, key): bitstring.\nreduc forall m: bitstring, k: key; sdec(senc(m, k), k) = m.\nfun h(bitstring): bitstring.\n\nfree yes, no: bitstring.\nfree voterKey: key [private].\nevent voted(bitstring).\n\nquery attacker(voterKey).\nquery v: bitstring; event(voted(v)).\n\nlet Voter(k: key, v: bitstring) =\n  new r: bitstring;\n  event voted(v);\n  out(c, senc((v, r), k)).\n\nlet Authority(k: key) =\n  in(c, x: bitstring);\n  let (v: bitstring, r: bitstring) = sdec(x, k) in\n  out(c, h(r)).\n\nprocess\n  ( !Voter(voterKey, choice[yes, no]) | !Authority(voterKey) )\n"
      }
  ];

  /**
   * @param {string} id The identifier of an example.
   * @return {Object|null} The example, or null.
   */
  static get(id: string) {
    return Examples.LIST.find(example => example.id === id) || null;
  }
}
// ----------------------------------------------------------------
