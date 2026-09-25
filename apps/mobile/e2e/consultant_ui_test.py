"""
Android UI test for the consultant experience, driven over adb + uiautomator against a running emulator/phone
with the app installed and pointed at a backend that has the accounts below.

    set CLIENT_EMAIL=...  CLIENT_PASSWORD=...  CONSULTANT_EMAIL=...  CONSULTANT_PASSWORD=...
    python apps/mobile/e2e/consultant_ui_test.py

Credentials come from the environment only. Exit code 0 = every check passed.
It signs out first, so it also works from a signed-in app.
"""
import os
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET

ADB = os.environ.get('ADB', r'C:\Android\Sdk\platform-tools\adb.exe')
PKG = 'app.visaiq.mobile'
ENV = dict(os.environ, MSYS_NO_PATHCONV='1')
SHOTS = os.environ.get('SHOT_DIR', os.path.join(os.path.dirname(__file__), 'shots'))
os.makedirs(SHOTS, exist_ok=True)

CLIENT = (os.environ.get('CLIENT_EMAIL'), os.environ.get('CLIENT_PASSWORD'))
CONSULTANT = (os.environ.get('CONSULTANT_EMAIL'), os.environ.get('CONSULTANT_PASSWORD'))
if not all(CLIENT + CONSULTANT):
    sys.exit('Set CLIENT_EMAIL, CLIENT_PASSWORD, CONSULTANT_EMAIL and CONSULTANT_PASSWORD in the environment.')


def adb(*args, binary=False):
    r = subprocess.run([ADB, *args], capture_output=True, env=ENV)
    return r.stdout if binary else r.stdout.decode('utf8', 'ignore')


def dump():
    adb('shell', 'uiautomator', 'dump', '/sdcard/ui.xml')
    xml = adb('exec-out', 'cat', '/sdcard/ui.xml')
    try:
        return ET.fromstring(xml)
    except ET.ParseError:
        return None


def nodes():
    root = dump()
    if root is None:
        return []
    out = []
    for n in root.iter('node'):
        m = re.match(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', n.get('bounds', ''))
        if not m:
            continue
        x1, y1, x2, y2 = map(int, m.groups())
        out.append({'text': n.get('text', ''), 'desc': n.get('content-desc', ''), 'cx': (x1 + x2) // 2, 'cy': (y1 + y2) // 2, 'cls': n.get('class', '')})
    return out


def find(needle, exact=False):
    needle = needle.lower()
    for n in nodes():
        for label in (n['text'], n['desc']):
            if label and ((label.lower() == needle) if exact else (needle in label.lower())):
                return n
    return None


def wait_for(needle, timeout=25, exact=False):
    end = time.time() + timeout
    while time.time() < end:
        n = find(needle, exact)
        if n:
            return n
        time.sleep(1.2)
    return None


def tap(needle, timeout=15, exact=False):
    n = wait_for(needle, timeout, exact)
    if not n:
        raise AssertionError(f'could not find "{needle}" to tap')
    adb('shell', 'input', 'tap', str(n['cx']), str(n['cy']))
    time.sleep(1.2)


def tap_button(text, timeout=15):
    """Taps a real button (dialog buttons share their text with the dialog title)."""
    end = time.time() + timeout
    while time.time() < end:
        for n in nodes():
            if n['cls'].endswith('Button') and n['text'].lower() == text.lower():
                adb('shell', 'input', 'tap', str(n['cx']), str(n['cy']))
                time.sleep(1.2)
                return
        time.sleep(1)
    raise AssertionError(f'could not find button "{text}"')


def tap_last(needle, timeout=15):
    """Taps the LAST element matching (a screen title often shares the button's text)."""
    end = time.time() + timeout
    needle = needle.lower()
    while time.time() < end:
        hits = [n for n in nodes() if needle in (n['text'] + '|' + n['desc']).lower() and (n['text'].lower() == needle or n['desc'].lower() == needle)]
        if hits:
            n = hits[-1]
            adb('shell', 'input', 'tap', str(n['cx']), str(n['cy']))
            time.sleep(1.2)
            return
        time.sleep(1)
    raise AssertionError(f'could not find "{needle}"')


def type_into(index, value):
    fields = [n for n in nodes() if n['cls'].endswith('EditText')]
    if index >= len(fields):
        raise AssertionError('input field not found')
    adb('shell', 'input', 'tap', str(fields[index]['cx']), str(fields[index]['cy']))
    time.sleep(0.4)
    adb('shell', 'input', 'keyevent', 'KEYCODE_MOVE_END')
    for _ in range(60):
        adb('shell', 'input', 'keyevent', 'KEYCODE_DEL')
    adb('shell', 'input', 'text', value.replace(' ', '%s'))


def shot(name):
    with open(os.path.join(SHOTS, f'{name}.png'), 'wb') as f:
        f.write(adb('exec-out', 'screencap', '-p', binary=True))


results = []


def check(name, fn):
    try:
        fn()
        results.append((name, True, ''))
        print(f'PASS  {name}')
    except Exception as e:  # noqa: BLE001
        shot('FAIL_' + re.sub(r'\W+', '_', name))
        results.append((name, False, str(e)))
        print(f'FAIL  {name}: {e}')


def go_tab(name, expect, tries=4):
    """Taps a bottom tab and waits for a sign that it opened (a tap right after a screen change can be missed)."""
    for _ in range(tries):
        n = find(name, exact=True)
        if n:
            adb('shell', 'input', 'tap', str(n['cx']), str(n['cy']))
        if wait_for(expect, 6):
            return
    raise AssertionError(f'tab "{name}" did not open (expected "{expect}")')


def sign_out_from_profile():
    # Scroll until the button is clear of the bottom tab bar (its bounds otherwise overlap the tabs).
    for _ in range(10):
        n = find('Sign out', exact=True)
        if n and n['cy'] < 1950:
            break
        adb('shell', 'input', 'swipe', '540', '1700', '540', '700', '250')
        time.sleep(0.7)
    tap_last('Sign out')
    tap_button('SIGN OUT')


def back_to_start():
    """Signs out if needed so every run starts on the welcome screen."""
    adb('shell', 'am', 'force-stop', PKG)
    adb('shell', 'monkey', '-p', PKG, '1')
    time.sleep(10)
    if find('Continue with Google'):
        return
    n = find('Profile', exact=True)
    if n:
        adb('shell', 'input', 'tap', str(n['cx']), str(n['cy']))
        time.sleep(2.5)
    sign_out_from_profile()
    assert wait_for('Continue with Google', 15), 'did not reach the start screen after signing out'


def open_consultant_door():
    tap('Consultant sign in')
    assert wait_for('Work email'), 'consultant sign-in form did not open'


def sign_in_consultant(email, password):
    type_into(0, email)
    type_into(1, password)
    adb('shell', 'input', 'keyevent', '4')  # close the keyboard
    time.sleep(1)
    tap('Sign in as consultant')


# ─── the checks ───────────────────────────────────────────────────────────────

def t_start_screen_link():
    back_to_start()
    assert find('Consultant or partner'), 'start screen has no consultant sign-in link'
    assert find('Continue with Google') and find('Sign up with email'), 'client entrances missing'


def t_door_layout():
    open_consultant_door()
    assert find('Consultant sign in'), 'title missing'
    assert not find('Continue with Google'), 'consultant door must not offer Google'
    assert not find('Create a new account') and not find('Sign up'), 'consultant door must not offer sign-up'
    assert find('created by invitation'), 'invitation note missing'
    assert find('Forgot password'), 'forgot-password link missing'


def t_client_refused():
    sign_in_consultant(*CLIENT)
    assert wait_for('not a consultant account', 20), 'a client account was not turned away at the consultant door'
    shot('client_refused')


def t_bad_password():
    type_into(0, CONSULTANT[0])
    type_into(1, 'definitely-wrong-password')
    adb('shell', 'input', 'keyevent', '4')
    time.sleep(1)
    tap('Sign in as consultant')
    assert wait_for('Incorrect email or password', 20), 'wrong password was not rejected'


def t_consultant_signs_in():
    sign_in_consultant(*CONSULTANT)
    assert wait_for('Consultant workspace', 30), 'did not land in the consultant workspace'
    shot('workspace')


def t_only_consultant_tabs():
    for tab in ('Schedule', 'Clients', 'Profile'):
        assert find(tab, exact=True), f'tab "{tab}" missing'
    for tab in ('Home', 'Apps', 'Docs', 'Bookings', 'Chat'):
        assert not find(tab, exact=True), f'client tab "{tab}" must not be visible to a consultant'
    assert not find('Search', exact=True), 'client search must not be visible'


def t_schedule():
    assert wait_for('upcoming', 40), 'schedule did not load'
    assert find('Upcoming') and find('Past & cancelled'), 'schedule tabs missing'
    assert find('Case shared') or find('Waiting for client access'), 'appointment access state missing'
    shot('schedule')


def t_case_view():
    row = None
    for n in nodes():
        if 'case shared' in (n['text'] + n['desc']).lower():
            row = n
            break
    assert row, 'no appointment with a shared case to open (seed one with the client account)'
    adb('shell', 'input', 'tap', str(row['cx']), str(row['cy'] - 120))
    assert wait_for('Shared by the client', 60), 'the shared case did not open'
    assert find('Your view is recorded'), 'audit notice missing'
    assert not find('Passport number') or find('documents'), 'unshared passport data must not appear'
    shot('case')
    adb('shell', 'input', 'keyevent', '4')
    time.sleep(1.5)


def t_locked_case_explains():
    go_tab('Clients', 'after they grant you access')
    assert find('Waiting for client access') or find('Case shared'), 'client access states missing'
    shot('clients')


def t_profile_security():
    go_tab('Profile', 'How client data works')
    assert find('Nothing is visible by default'), 'privacy explanation missing'
    assert find('unlock'), 'app-lock switch missing'
    assert find('Sign out'), 'sign out missing'
    shot('profile')


def t_session_survives_restart():
    adb('shell', 'am', 'force-stop', PKG)
    adb('shell', 'monkey', '-p', PKG, '1')
    assert wait_for('Consultant workspace', 40), 'consultant was signed out by an app restart'
    assert not find('Continue with Google'), 'landed on the client start screen'


def t_sign_out_returns_to_start():
    go_tab('Profile', 'How client data works')
    sign_out_from_profile()
    assert wait_for('Continue with Google', 15), 'sign out did not return to the start screen'


def t_client_sees_no_consultant_workspace():
    tap('I already have an account')
    assert wait_for('Email address'), 'client sign-in form missing'
    type_into(0, CLIENT[0])
    type_into(1, CLIENT[1])
    adb('shell', 'input', 'keyevent', '4')
    time.sleep(1)
    box = find('I accept Terms')
    if box:
        adb('shell', 'input', 'tap', '130', str(box['cy']))
        time.sleep(0.6)
    tap_last('Sign in')
    assert wait_for('Your visa journey', 40) or wait_for('Get started', 5), 'client did not reach Home'
    assert not find('Consultant workspace'), 'a client must not see the consultant workspace'
    assert find('Chat', exact=True) and find('Bookings', exact=True), 'client tabs missing'
    shot('client_home')


if __name__ == '__main__':
    check('start screen offers the consultant door', t_start_screen_link)
    check('consultant door: own layout, no Google, no sign-up', t_door_layout)
    check('a client account is refused at the consultant door', t_client_refused)
    check('a wrong password is rejected', t_bad_password)
    check('consultant signs in and lands in the workspace', t_consultant_signs_in)
    check('only consultant tabs are shown', t_only_consultant_tabs)
    check('schedule loads with access states', t_schedule)
    check('a shared case opens and shows the audit notice', t_case_view)
    check('clients list explains access states', t_locked_case_explains)
    check('profile shows privacy rules, lock switch and sign out', t_profile_security)
    check('the consultant session survives an app restart', t_session_survives_restart)
    check('sign out returns to the start screen', t_sign_out_returns_to_start)
    check('a client signs in and sees no consultant workspace', t_client_sees_no_consultant_workspace)
    failed = [r for r in results if not r[1]]
    print(f'\n{len(results) - len(failed)}/{len(results)} passed')
    sys.exit(1 if failed else 0)
