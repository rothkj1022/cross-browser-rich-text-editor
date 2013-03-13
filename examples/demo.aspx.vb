Partial Class demo
    Inherits System.Web.UI.Page

    Public sContent As String = ""

    Public Function RTESafe(ByVal strText As String) As String
        'returns safe code for preloading in the RTE
        Dim tmpString As String = ""

        tmpString = Trim(strText)

        'convert all types of single quotes
        tmpString = Replace(tmpString, Chr(145), Chr(39))
        tmpString = Replace(tmpString, Chr(146), Chr(39))
        tmpString = Replace(tmpString, "'", "&#39;")

        'convert all types of double quotes
        tmpString = Replace(tmpString, Chr(147), Chr(34))
        tmpString = Replace(tmpString, Chr(148), Chr(34))
        'tmpString = replace(tmpString, """", "\""")

        'replace carriage returns & line feeds
        tmpString = Replace(tmpString, Chr(10), " ")
        tmpString = Replace(tmpString, Chr(13), " ")

        RTESafe = tmpString
    End Function

    Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load
        If Request.Form("rte1") = "" Then
            sContent = "here's the " & Chr(13) & """preloaded <b>content</b>"""
            sContent = RTESafe(sContent)
        Else
            sContent = RTESafe(Request.Form("rte1"))
        End If
    End Sub
End Class
