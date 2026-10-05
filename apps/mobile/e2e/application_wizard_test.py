"""
Android UI test for the new-application wizard: the answers decide the document checklist.

Runs on a connected emulator/phone against the production API, with a client account from the environment:

    set CLIENT_EMAIL=...  CLIENT_PASSWORD=...
    python apps/mobile/e2e/application_wizard_test.py

It answers as a self-employed applicant with a family sponsor and a previous refusal, then checks that:
  - the review step shows the checklist with items that come from those answers,
  - the application is created,
  - the Documents tab lists the same answer-driven documents.
Exit code 0 = all checks passed.
"""
import importlib.util
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('ui', os.path.join(HERE, 'consultant_ui_test.py'))
ui = importlib.util.module_from_spec(spec)
os.environ.setdefault('CONSULTANT_EMAIL', 'unused@example.com')
os.environ.setdefault('CONSULTANT_PASSWORD', 'unused')
spec.loader.exec_module(ui)


def scroll_tap(text):
    """Scrolls the form until an option is on screen, then taps it. Looks down the form first, then back up."""
    for direction in (('1500', '800'), ('800', '1500')):
        for _ in range(8):
            n = ui.find(text)
            if n and 300 < n['cy'] < 1850:
                ui.adb('shell', 'input', 'tap', str(n['cx']), str(n['cy']))
                time.sleep(1)
                return
            ui.adb('shell', 'input', 'swipe', '540', direction[0], '540', direction[1], '300')
            time.sleep(0.8)
    raise AssertionError(f'option not found: {text}')


def continue_():
    ui.tap_last('Continue →')
    time.sleep(1.5)


def sign_in():
    ui.back_to_start()
    ui.tap('I already have an account')
    ui.type_into(0, ui.CLIENT[0])
    ui.type_into(1, ui.CLIENT[1])
    ui.adb('shell', 'input', 'keyevent', '4')
    time.sleep(1)
    box = ui.find('I accept Terms')
    if box:
        ui.adb('shell', 'input', 'tap', '130', str(box['cy']))
        time.sleep(0.6)
    ui.tap_last('Sign in')
    assert ui.wait_for('Your visa journey', 40) or ui.wait_for('Get started', 5), 'could not sign in'


def answer_wizard():
    ui.tap('Apps', exact=True)
    time.sleep(2)
    ui.tap('New', exact=True)
    time.sleep(2)
    ui.tap('Schengen Tourist')
    continue_()                                   # 1 visa type
    ui.type_into(0, 'India')
    ui.type_into(1, 'United Arab Emirates')
    ui.adb('shell', 'input', 'keyevent', '4')
    continue_()                                   # 2 nationality and residence
    continue_()                                   # 3 destination (pre-filled)
    ui.type_into(0, '34')                         # 4 about you
    ui.adb('shell', 'input', 'keyevent', '4')
    ui.tap('Business', exact=False)
    scroll_tap('Self-employed or own a business')
    continue_()
    scroll_tap('A person pays (family or friend)')  # 5 money, history, family
    scroll_tap('A visa was refused before')
    scroll_tap('Married')
    continue_()


def checks():
    assert ui.wait_for('Your document checklist', 20), 'the review step did not show a checklist'
    review = ui.dump()
    texts = [n['text'] for n in ui.nodes() if n['text']]
    assert any('because of your answers' in t for t in texts), 'the checklist does not say which items come from the answers'
    for needed in ('Business registration and tax returns', 'Sponsor letter and sponsor bank statements',
                   'Previous refusal letter and your explanation', 'Marriage certificate'):
        assert needed in texts, f'missing from the checklist: {needed}'
    assert review is not None
    ui.shot('wizard_review')
    ui.tap_last('Create application')
    assert ui.wait_for('Application', 25) or ui.wait_for('Requirements', 25), 'the application was not created'
    ui.shot('wizard_created')


def documents_match():
    ui.tap('Docs', exact=True)
    assert ui.wait_for('Application documents', 25), 'documents did not load'
    ui.shot('wizard_documents')
    for _ in range(6):
        if ui.find('Sponsor letter and sponsor bank statements'):
            break
        ui.adb('shell', 'input', 'swipe', '540', '1500', '540', '800', '300')
        time.sleep(0.8)
    assert ui.find('Sponsor letter and sponsor bank statements'), 'Documents does not list the sponsor letter'
    assert ui.find('Business registration and tax returns'), 'Documents does not list the business records'


if __name__ == '__main__':
    results = []
    for name, fn in [
        ('sign in as a client', sign_in),
        ('answer the wizard (about you, money, history, family)', answer_wizard),
        ('review shows the answer-driven checklist; application created', checks),
        ('Documents lists the same documents', documents_match),
    ]:
        try:
            fn()
            results.append((name, True))
            print(f'PASS  {name}')
        except Exception as e:  # noqa: BLE001
            ui.shot('FAIL_' + name.split()[0])
            results.append((name, False))
            print(f'FAIL  {name}: {e}')
    failed = [r for r in results if not r[1]]
    print(f'\n{len(results) - len(failed)}/{len(results)} passed')
    sys.exit(1 if failed else 0)
