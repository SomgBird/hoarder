import styles from "./ItemView.module.css";

export default function ItemView() {
  return (
    <div className={styles.page}>
      <h1>Albert Einstein</h1>
      <hr />

      <table cellPadding={6}>
        <tbody>
          <tr>
            {/* Main text column */}
            <td valign="top">
              <p>
                <b>Albert Einstein</b> (14 March 1879 &ndash; 18 April 1955) was
                a German-born theoretical physicist widely held to be one of the
                greatest and most influential scientists of all time.
              </p>
              <p>
                Einstein is best known for developing the theory of relativity,
                but he also made important contributions to the development of
                the theory of quantum mechanics.
              </p>

              <h2>Contents</h2>
              <ul>
                <li>
                  <a href="#life">Life and career</a>
                </li>
                <li>
                  <a href="#work">Scientific work</a>
                </li>
              </ul>

              <h2 id="life">Life and career</h2>
              <p>
                Einstein was born in Ulm, in the Kingdom of W&uuml;rttemberg, in
                the German Empire, on 14 March 1879. His parents were Hermann
                Einstein and Pauline Koch.
              </p>

              <h2 id="work">Scientific work</h2>
              <p>
                In 1905, sometimes called his <i>annus mirabilis</i>, he
                published four groundbreaking papers on the photoelectric
                effect, Brownian motion, special relativity, and
                mass&ndash;energy equivalence.
              </p>
            </td>

            {/* Right info box */}
            <td valign="top" width={260}>
              <table
                border={1}
                cellPadding={4}
                cellSpacing={0}
                className={styles.infobox}
              >
                <tbody>
                  <tr>
                    <th align="center">Albert Einstein</th>
                  </tr>
                  <tr>
                    <td align="center">
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/d/d3/Albert_Einstein_Head.jpg"
                        alt="Albert Einstein"
                        width={220}
                      />
                      <br />
                      <small>Einstein in 1921</small>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <b>Born:</b> 14 March 1879, Ulm, Germany
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <b>Died:</b> 18 April 1955, Princeton, USA
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <b>Fields:</b> Physics
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <b>Known for:</b> Relativity, E=mc&sup2;
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      <hr />
      <p>
        <small>This page was last edited on 1 January 2024.</small>
      </p>
    </div>
  );
}
